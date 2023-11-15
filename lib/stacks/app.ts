import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Repository, TagMutability } from 'aws-cdk-lib/aws-ecr';
import { Artifact, IStage, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import {
  CodeBuildAction,
  CodeStarConnectionsSourceAction,
} from 'aws-cdk-lib/aws-codepipeline-actions';
import { BuildSpec, Project } from 'aws-cdk-lib/aws-codebuild';
import { IntegrationType, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';

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

    /*
                 * # Infra
                 * - [ ] ECR repo
                 *   - [ ] ECR resource based policy (lambda retrieve, codebuild put)
                 * - [ ] Lambda
                 * - [ ] API Gateway
                 *
                 * # CI/CD
                 * - [ ] GitHub source
                 * - [ ] Normal CodeBuild
                 *   - [ ] Project + Role
                 * - [ ] CodeDeploy
                 *   - [ ] Application, Config + Role
                 */

    const func = new DockerImageFunction(this, 'Function', {
      code: DockerImageCode.fromEcr(Repository.fromRepositoryArn(this,
          'MealPlannerRepo',
          'arn:aws:ecr:us-east-1:416327764979:repository/meal-planner-api')),
      memorySize: 256,
      logRetention: RetentionDays.ONE_DAY,
    });
    const live = func.addAlias('Live');
    const integration = new LambdaIntegration(live);

    const api = new RestApi(this, 'cdk-meal-planner-api', {
      restApiName: 'CDK Meal Planner API',
      description: 'To test how CDK works',
    });
    api.root.addProxy({
      defaultIntegration: integration,
    });
  }
}
