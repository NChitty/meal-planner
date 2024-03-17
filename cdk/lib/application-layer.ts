import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Code, Function, Handler, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import path = require('path');
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';

export interface ApplicationLayerStackProps extends StackProps {
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


    new LambdaRestApi(this, 'MealPlannerApi', {
      handler,
      proxy: true,
    });
  }
}
