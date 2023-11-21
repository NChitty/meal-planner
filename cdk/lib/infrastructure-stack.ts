import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { AwsCredentials, GitHubWorkflow } from 'cdk-pipelines-github';
import { ShellStep } from 'aws-cdk-lib/pipelines';

export interface MealPlannerProps extends StackProps {
  gitHubRoleArn: string;
}

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
  constructor(scope: Construct, id: string, props?: MealPlannerProps) {
    super(scope, id, props);
    const pipeline = new GitHubWorkflow(this, 'Pipeline', {
      synth: new ShellStep('Build', {
        commands: [
          'npm install',
          'npm build',
        ],
      }),
      awsCreds: AwsCredentials.fromOpenIdConnect({
        gitHubActionRoleArn: props?.gitHubRoleArn || 'undefined',
      }),
    });
  }
}
