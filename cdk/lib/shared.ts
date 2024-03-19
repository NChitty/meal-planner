import { Stack, StackProps, Stage, StageProps } from 'aws-cdk-lib';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { HostedZoneDelegationRole } from './iam/delegation-role';
import { ProjectEnvironment, sharedEnvironment } from './pipeline';

export interface SharedStackProps extends StackProps {
  readonly environments: ProjectEnvironment[];
}

/**
  * Stack for holding shared resources.
  *
  * For some reason, CDK isn't a huge fan a deploying resources within it's pipeline stack.
  */
class SharedStack extends Stack {
  readonly hostedZoneId: string;
  readonly environmentRoles: { [key: string]: HostedZoneDelegationRole };
  /**
    * Build the stack resources.
    * @param{Construct} scope parent
    * @param{string} id logical id
    * @param{SharedStackProps} props properties
    */
  constructor(scope: Construct, id: string, props: SharedStackProps) {
    super(scope, id, props);

    const projectsHostedZone = HostedZone.fromHostedZoneId(
        this,
        'ProjectsHostedZone',
        'Z09758583PVMFV16WNRXR',
    );
    this.hostedZoneId = projectsHostedZone.hostedZoneId;

    props.environments.forEach((projectEnvironment) => {
      const roleWrapper = new HostedZoneDelegationRole(
          this,
          `${projectEnvironment.name}HostedZoneDelegation`,
          {
            hostedZoneArn: projectsHostedZone.hostedZoneArn,
            projectEnvironment,
          });
      projectsHostedZone.grantDelegation(roleWrapper.delegationRole);
      this.environmentRoles[projectEnvironment.name] = roleWrapper;
    });
  }
}


export interface SharedStageProps extends StageProps {
  readonly environments: ProjectEnvironment[];
}
/**
  * Stage that deploys shared resource stack.
  */
export class SharedStage extends Stage {
  public readonly hostedZoneId: string;
  public readonly environmentRoles: { [key: string]: HostedZoneDelegationRole };
  /**
    * Constructor for shared stack items.
    * @param{Construct} scope parent
    * @param{string} id logical id
    * @param{SharedStageProps} props properties
    */
  constructor(scope: Construct, id: string, props: SharedStageProps) {
    super(scope, id, props);
    const sharedStack = new SharedStack(this, 'SharedStack', {
      env: sharedEnvironment,
      environments: props.environments,
    });
    this.hostedZoneId = sharedStack.hostedZoneId;
    this.environmentRoles = sharedStack.environmentRoles;
  }
}
