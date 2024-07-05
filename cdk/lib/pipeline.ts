import { Environment, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import MealPlannerStage from './application-stage';
import {
  CodePipeline,
  CodePipelineSource,
  ManualApprovalStep,
  ShellStep,
} from 'aws-cdk-lib/pipelines';
import path = require('path');

export interface ProjectEnvironment extends Environment {
  /**
    * The name of the environment for use in logical ids.
    */
  readonly name: string;

  /**
    * For the given project, the subdomain after the project subdomain. Leave blank for "production"
    */
  readonly subdomain?: string;
}

export const sharedEnvironment: Environment = {
  account: '211125587522',
  region: 'us-east-1',
};

export const stagingEnvironment: ProjectEnvironment = {
  account: '381491920629',
  region: 'us-east-1',
  name: 'Staging',
  subdomain: 'staging',
};

export const prodEnvironment: ProjectEnvironment = {
  account: '654654503876',
  region: 'us-east-1',
  name: 'Prod',
};

/**
  * Stack that holds pipeline.
  */
export default class PipelineStack extends Stack {
  /**
    * Constructor for the pipeline stack.
    * @param{Construct} scope the parent
    * @param{id} id the logical id of this construct
    * @param{StackProps} props properties for this stack
    */
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const synth = new ShellStep('Synth', {
      input: CodePipelineSource.connection('NChitty/meal-planner', 'main', {
        /* eslint-disable max-len */
        connectionArn: 'arn:aws:codestar-connections:us-east-1:211125587522:connection/4aa04046-6a83-4774-ad05-50049811955d',
        /* eslint-enable max-len */
      }),
      commands: [
        'npm ci',
        'npm run build',
        'npx cdk synth',
      ],
      primaryOutputDirectory: path.join('.', 'cdk.out'),
    });

    const pipeline = new CodePipeline(this, 'Pipeline', {
      synth,
      crossAccountKeys: true,
    });

    const stagingStage = new MealPlannerStage(this, 'MealPlannerAppStaging', {
      env: stagingEnvironment,
    });
    const prodStage = new MealPlannerStage(this, 'MealPlannerAppProd', {
      env: prodEnvironment,
    });

    pipeline.addStage(stagingStage)
        .addPost(new ShellStep('Playwright E2E Test', {
          commands: [
            'npm ci',
            'npx playwright test',
          ],
        }));
    pipeline.addStage(prodStage)
        .addPre(new ManualApprovalStep('Promote to Production'));
  }
}
