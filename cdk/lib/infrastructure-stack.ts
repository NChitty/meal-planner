import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { AwsCredentials, GitHubActionRole, GitHubWorkflow } from 'cdk-pipelines-github';
import { ShellStep } from 'aws-cdk-lib/pipelines';

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
    const provider = new GitHubActionRole(this, 'github-action-role', {
      repos: ['NChitty/meal-planner'],
    });
    const pipeline = new GitHubWorkflow(this, 'Pipeline', {
      synth: new ShellStep('Build', {
        commands: [
          'npm install',
          'npm build',
        ],
      }),
      awsCreds: AwsCredentials.fromOpenIdConnect({
        gitHubActionRoleArn: provider.role.roleArn,
      }),
    });
  }
}
