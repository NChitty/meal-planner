import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Code, Function, Handler, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import path = require('path');
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Role } from 'aws-cdk-lib/aws-iam';
import {
  CrossAccountZoneDelegationRecord,
  PublicHostedZone,
} from 'aws-cdk-lib/aws-route53';
import { MealPlannerHttpApi } from './constructs/api';

export interface ApplicationLayerStackProps extends StackProps {
  readonly delegationRole: Role;

  /**
    * The domain for where to host the api.
    */
  readonly domain: string;

  readonly parentHostedZoneId?: string;
  readonly parentHostedZoneName?: string;

  /**
    * Table where the partition key refers to the top-level element of recipes.
    */
  readonly recipeTable: TableV2;
}

/**
 * Stack for deploying meal planner app.
 */
export default class ApplicationLayerStack extends Stack {
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
        RECIPE_TABLE_NAME: props.recipeTable.tableName,
      },
      logRetention: RetentionDays.ONE_WEEK,
    });

    props.recipeTable.grantReadWriteData(handler);

    const hostedZone = new PublicHostedZone(this, 'HostedZone', {
      zoneName: props.domain,
    });

    new CrossAccountZoneDelegationRecord(this, 'Delegate', {
      delegatedZone: hostedZone,
      parentHostedZoneId: props.parentHostedZoneId,
      parentHostedZoneName: props.parentHostedZoneName,
      delegationRole: props.delegationRole,
    });

    new MealPlannerHttpApi(this, 'Api', {
      domain: props.domain,
      hostedZone,
      lambda: handler,
    });
  }
}
