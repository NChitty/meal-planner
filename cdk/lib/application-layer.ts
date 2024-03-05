import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Code, Function, Handler, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import path = require('path');

export interface ApplicationLayerStackProps extends cdk.StackProps {

    /**
      * The username for the database.
      */
    readonly databaseCredentialsSecret: secretsManager.Secret;

    /**
      * The username for the database.
      */
    readonly databaseUsername: string;

    /**
      * Security group to apply to lambda.
      */
    readonly lambdaSecurityGroup: ec2.SecurityGroup;

    /**
      * The database proxy from the persistence layer.
      */
    readonly proxy: rds.DatabaseProxy;

    /**
      * The vpc to put the lambda function in.
      */
    readonly vpc: ec2.IVpc;
}

/**
 * Stack for deploying meal planner app.
 */
export default class ApplicationLayerStack extends cdk.Stack {
  /**
   * Construct a meal planner stack.
   * @param{Construct} scope not sure.
   * @param{string} id idk.
   * @param{StackProps} props the last thing?
   */
  constructor(scope: Construct, id: string, props: ApplicationLayerStackProps) {
    super(scope, id, props);

    const handler = new Function(this, 'MealPlannerFunction', {
      functionName: 'MealPlannerFunction',
      runtime: Runtime.FROM_IMAGE,
      code: Code.fromAssetImage(path.join(__dirname, '..', '..', 'lambda'), {
        assetName: 'meal-planner-api',
        target: 'meal-planner-api',
      }),
      handler: Handler.FROM_IMAGE,
      environment: {
        AWS_LAMBDA_HTTP_IGNORE_STAGE_IN_PATH: 'true',
        DB_HOST: props.proxy.endpoint,
        DB_NAME: 'mealplanner',
        DB_USERNAME: props.databaseUsername,
        SECRET_ARN: props.databaseCredentialsSecret.secretArn,
      },
      logRetention: RetentionDays.ONE_WEEK,
      vpc: props.vpc,
      securityGroups: [props.lambdaSecurityGroup],
    });

    props.databaseCredentialsSecret.grantRead(handler);
    props.proxy.grantConnect(handler);

    new LambdaRestApi(this, 'MealPlannerApi', {
      handler,
      proxy: true,
    });
  }
}
