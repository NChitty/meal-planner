import { Stack, StackProps } from 'aws-cdk-lib';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { HostedZoneDelegationRole } from './iam/delegation-role';
import { ProjectEnvironment } from './pipeline';

export interface SharedStackProps extends StackProps {
  readonly environment: ProjectEnvironment;
}

/**
  * Stack for holding shared resources.
  *
  * For some reason, CDK isn't a huge fan a deploying resources within it's pipeline stack.
  */
export class SharedStack extends Stack {
  public readonly hostedZoneId: string;
  public readonly roleWrapper: HostedZoneDelegationRole;
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

    this.roleWrapper = new HostedZoneDelegationRole(
        this,
        `${props.environment.name}HostedZoneDelegation`,
        {
          hostedZoneArn: projectsHostedZone.hostedZoneArn,
          projectEnvironment: props.environment,
        });
    projectsHostedZone.grantDelegation(this.roleWrapper.delegationRole);
  }
}
