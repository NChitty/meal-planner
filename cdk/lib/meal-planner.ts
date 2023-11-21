import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Code, Function, Handler, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';

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

    const handler = new Function(this, 'MealPlannerFunction',
        {
          runtime: Runtime.FROM_IMAGE,
          code: Code.fromEcrImage(repo, {}),
          handler: Handler.FROM_IMAGE,
        },
    );

    new LambdaRestApi(this, 'MealPlannerApi', {
      handler,
      proxy: true,
    });
  }
}
