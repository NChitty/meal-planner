import { Construct } from 'constructs';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Code, Function, Handler, ParamsAndSecretsLayerVersion, ParamsAndSecretsVersions, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  InterfaceVpcEndpoint,
  InterfaceVpcEndpointAwsService,
  Port,
  PrivateSubnet,
  SecurityGroup,
  Vpc,
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
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

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
    const privateSubnetA = new PrivateSubnet(this, 'PrivateSubnetA', {
      vpcId: vpc.vpcId,
      availabilityZone: vpc.availabilityZones[0],
      cidrBlock: '172.31.96.0/24',
    });
    const privateSubnetB = new PrivateSubnet(this, 'PrivateSubnetB', {
      vpcId: vpc.vpcId,
      availabilityZone: vpc.availabilityZones[1],
      cidrBlock: '172.31.97.0/24',
    });

    new InterfaceVpcEndpoint(this, 'SecretsManagerEndpoint', {
      service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      vpc,
      subnets: {
        subnets: [privateSubnetA, privateSubnetB],
      },
    });

    vpc.privateSubnets.push(
        privateSubnetA,
        privateSubnetB,
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

    const handler = new Function(this, 'MealPlannerFunction', {
      functionName: 'MealPlannerFunction',
      runtime: Runtime.FROM_IMAGE,
      code: Code.fromEcrImage(repo, {}),
      handler: Handler.FROM_IMAGE,
      environment: {
        AWS_LAMBDA_HTTP_IGNORE_STAGE_IN_PATH: 'true',
        DB_HOST: proxy.endpoint,
        DB_NAME: 'postgres',
        DB_USERNAME: databaseUsername,
        SECRET_ARN: databaseCredentialsSecret.secretArn,
      },
      logRetention: RetentionDays.ONE_WEEK,
      vpc,
      securityGroups: [lambdaRdsProxySecurityGroup],
    });

    databaseCredentialsSecret.grantRead(handler);
    proxy.grantConnect(handler);

    new LambdaRestApi(this, 'MealPlannerApi', {
      handler,
      proxy: true,
    });
  }
}
