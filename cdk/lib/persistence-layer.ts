import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager';

/**
  * Stack for stateful resources that are grouped to the deployment context
  */
export default class PersistenceLayerStack extends cdk.Stack {
  public readonly proxy: rds.DatabaseProxy;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;
  public readonly databaseUsername: string;
  public readonly databaseSecretArn: string;
  public readonly databaseCredentialsSecret: secretsManager.Secret;
  public readonly vpc: ec2.IVpc;

  /**
   * Constructs a stack meant for the image repository and other fixed resources.
   * @param{Construct} scope Parent construct
   * @param{string} id Logical ID
   * @param{StackProps} props properties for the stack
   */
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });
    const privateSubnetA = new ec2.PrivateSubnet(this, 'PrivateSubnetA', {
      vpcId: this.vpc.vpcId,
      availabilityZone: this.vpc.availabilityZones[0],
      cidrBlock: '172.31.96.0/24',
    });
    const privateSubnetB = new ec2.PrivateSubnet(this, 'PrivateSubnetB', {
      vpcId: this.vpc.vpcId,
      availabilityZone: this.vpc.availabilityZones[1],
      cidrBlock: '172.31.97.0/24',
    });

    new ec2.InterfaceVpcEndpoint(this, 'SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      vpc: this.vpc,
      subnets: {
        subnets: [privateSubnetA, privateSubnetB],
      },
    });

    this.vpc.privateSubnets.push(
        privateSubnetA,
        privateSubnetB,
    );

    this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'Lambda RDS Proxy SG', {
      vpc: this.vpc,
    });
    const dbConnectionSecurityGroup = new ec2.SecurityGroup(this, 'RDS SG', {
      vpc: this.vpc,
    });
    dbConnectionSecurityGroup.addIngressRule(
        dbConnectionSecurityGroup,
        ec2.Port.tcp(5432),
        'allow db connection',
    );
    dbConnectionSecurityGroup.addIngressRule(
        this.lambdaSecurityGroup,
        ec2.Port.tcp(5432),
        'allow db connection',
    );

    this.databaseUsername = 'postgres';

    this.databaseCredentialsSecret = new secretsManager.Secret(this, 'DatabaseCredentialsSecret', {
      secretName: `${id}-rds-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: this.databaseUsername,
        }),
        excludeCharacters: '@/ "',
        generateStringKey: 'password',
      },
    });

    const rdsInstance = new rds.DatabaseInstance(this, 'DBInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      credentials: rds.Credentials.fromSecret(this.databaseCredentialsSecret),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: this.vpc,
      allocatedStorage: 20,
      maxAllocatedStorage: 20,
      backupRetention: cdk.Duration.days(0),
      databaseName: 'meal-planner',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      securityGroups: [dbConnectionSecurityGroup],
    });

    // Create an RDS Proxy
    this.proxy = rdsInstance.addProxy(`${id}-proxy`, {
      secrets: [this.databaseCredentialsSecret],
      debugLogging: true,
      vpc: this.vpc,
      securityGroups: [dbConnectionSecurityGroup],
    });
  }
}
