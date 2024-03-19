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
import { SharedStage } from './shared';

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
      /* eslint-disable max-len */
      input: CodePipelineSource.connection('NChitty/meal-planner', 'main', {
        connectionArn: 'arn:aws:codestar-connections:us-east-1:211125587522:connection/4aa04046-6a83-4774-ad05-50049811955d',
      /* eslint-enable max-len */
      }),
      commands: [
        'cd cdk',
        'npm ci',
        'npm run build',
        'npx cdk synth',
      ],
      primaryOutputDirectory: path.join('.', 'cdk', 'cdk.out'),
    });

    const pipeline = new CodePipeline(this, 'Pipeline', {
      synth,
      crossAccountKeys: true,
    });

    const environments = [stagingEnvironment, prodEnvironment];
    const sharedStage = new SharedStage(this, 'MealPlannerShared', {
      environments,
      env: sharedEnvironment,
    });

    const stagingStage = this.buildStage(stagingEnvironment, sharedStage);
    const prodStage = this.buildStage(prodEnvironment, sharedStage);


    pipeline.addStage(stagingStage);
    pipeline.addStage(prodStage)
        .addPre(new ManualApprovalStep('ProdApproval'));
  }

  readonly buildStage = (
      environment: ProjectEnvironment,
      sharedStage: SharedStage,
  ): MealPlannerStage => {
    return new MealPlannerStage(this, `MealPlannerApp${environment.name}`, {
      delegationRole: sharedStage.environmentRoles[environment.name].delegationRole,
      domain: sharedStage.environmentRoles[environment.name].normalizedDomain,
      env: environment,
      parentHostedZoneId: sharedStage.hostedZoneId,
    });
  };
}
