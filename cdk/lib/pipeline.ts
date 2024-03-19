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
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { HostedZoneDelegationRole } from './iam/delegation-role';

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

    const projectsHostedZone = HostedZone.fromHostedZoneId(
        this,
        'ProjectsHostedZone',
        'Z09758583PVMFV16WNRXR',
    );

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

    const stagingRoleWrapper = new HostedZoneDelegationRole(
        this,
        `${stagingEnvironment.name}HostedZoneDelegationRole`,
        {
          hostedZoneArn: projectsHostedZone.hostedZoneArn,
          projectEnvironment: stagingEnvironment,
        });

    projectsHostedZone.grantDelegation(stagingRoleWrapper.delegationRole);

    const prodRoleWrapper = new HostedZoneDelegationRole(
        this,
        `${prodEnvironment.name}HostedZoneDelegationRole`,
        {
          hostedZoneArn: projectsHostedZone.hostedZoneArn,
          projectEnvironment: stagingEnvironment,
        });
    projectsHostedZone.grantDelegation(prodRoleWrapper.delegationRole);

    const stagingStage = new MealPlannerStage(this, 'MealPlannerAppStaging', {
      delegationRole: stagingRoleWrapper.delegationRole,
      domain: stagingRoleWrapper.normalizedDomain,
      env: stagingEnvironment,
      parentHostedZoneId: projectsHostedZone.hostedZoneId,
    });
    const prodStage = new MealPlannerStage(this, 'MealPlannerAppProd', {
      delegationRole: prodRoleWrapper.delegationRole,
      domain: prodRoleWrapper.normalizedDomain,
      env: prodEnvironment,
      parentHostedZoneId: projectsHostedZone.hostedZoneId,
    });

    pipeline.addStage(stagingStage);
    pipeline.addStage(prodStage).addPre(new ManualApprovalStep('ProdApproval'));
  }
}
