import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {aws_s3 as s3} from 'aws-cdk-lib';

/**
 * Stack for deploying meal planner app.
 */
export default class MealPlannerStack extends cdk.Stack {
  /**
     * Construct a meal planner stack.
     * @param{Construct} scope not sure.
     * @param{string} id idk.
     * @param{cdk.StackProps} props the last thing?
     */
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new s3.Bucket(this, 'MyFirstBucket', {
      versioned: true,
    });
  }
}
