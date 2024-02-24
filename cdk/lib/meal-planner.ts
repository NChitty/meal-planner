import { Construct } from 'constructs';
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Code, Function, Handler, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  Port,
  PrivateSubnet,
  SecurityGroup,
  Vpc,
  SubnetType,
} from 'aws-cdk-lib/aws-ec2';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import {
  CfnDBProxyTargetGroup,
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  PostgresEngineVersion,
} from 'aws-cdk-lib/aws-rds';

/**
 * Stack for deploying meal planner app.
 */
export default class MealPlannerStack extends Stack {
  /**
   * Construct a meal planner stack.
   * @param{Construct} scope not sure.
   * @param{string} id idk.
   * @param{StackProps} props the last thing?
   */
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const repositoryArn: string = this.node.tryGetContext('mealPlannerEcrArn');

    const repo = Repository.fromRepositoryArn(this, 'MealPlannerRepo',
        repositoryArn,
    );

    const vpc = Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    vpc.privateSubnets.push(
        new PrivateSubnet(this, 'PrivateSubnetA', {
          vpcId: vpc.vpcId,
          availabilityZone: vpc.availabilityZones[0],
          cidrBlock: '172.31.96.0/24',
        }),
        new PrivateSubnet(this, 'PrivateSubnetB', {
          vpcId: vpc.vpcId,
          availabilityZone: vpc.availabilityZones[1],
          cidrBlock: '172.31.97.0/24',
        }),
    );

    const lambdaRdsProxySecurityGroup = new SecurityGroup(this, 'Lambda RDS Proxy SG', {
      vpc,
    });
    const dbConnectionSecurityGroup = new SecurityGroup(this, 'RDS SG', {
      vpc,
    });
    dbConnectionSecurityGroup.addIngressRule(
        dbConnectionSecurityGroup,
        Port.tcp(5432),
        'allow db connection',
    );
    dbConnectionSecurityGroup.addIngressRule(
        lambdaRdsProxySecurityGroup,
        Port.tcp(5432),
        'allow db connection',
    );

    const databaseUsername = 'postgres';

    const databaseCredentialsSecret = new Secret(this, 'DatabaseCredentialsSecret', {
      secretName: `${id}-rds-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: databaseUsername,
        }),
        excludeCharacters: '@/ "',
        generateStringKey: 'password',
      },
    });

    new StringParameter(this, 'DatabaseCredentialArn', {
      parameterName: 'rds-credentials-arn',
      stringValue: databaseCredentialsSecret.secretArn,
    });

    const rdsInstance = new DatabaseInstance(this, 'DBInstance', {
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_15,
      }),
      credentials: Credentials.fromSecret(databaseCredentialsSecret),
      instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO),
      vpc,
      removalPolicy: RemovalPolicy.DESTROY,
      deletionProtection: false,
      securityGroups: [dbConnectionSecurityGroup],
    });

    // Create an RDS Proxy
    const proxy = rdsInstance.addProxy(`${id}-proxy`, {
      secrets: [databaseCredentialsSecret],
      debugLogging: true,
      vpc,
      securityGroups: [dbConnectionSecurityGroup],
    });

    // Workaround for bug where TargetGroupName is not set but required
    const targetGroup = proxy.node.children.find((child: any) => {
      return child instanceof CfnDBProxyTargetGroup;
    }) as CfnDBProxyTargetGroup;

    targetGroup.addPropertyOverride('TargetGroupName', 'default');

    const handler = new Function(this, 'MealPlannerFunction', {
      runtime: Runtime.FROM_IMAGE,
      code: Code.fromEcrImage(repo, {}),
      handler: Handler.FROM_IMAGE,
      environment: {
        DB_HOST: proxy.endpoint,
        DB_NAME: 'meal-planner',
        DB_USERNAME: databaseUsername,
        SECRET_ARN: databaseCredentialsSecret.secretArn,
      },
      securityGroups: [lambdaRdsProxySecurityGroup],
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    new LambdaRestApi(this, 'MealPlannerApi', {
      handler,
      proxy: true,
    });
  }
}
