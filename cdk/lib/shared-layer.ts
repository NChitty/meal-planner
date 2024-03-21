import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { ProjectEnvironment, sharedEnvironment } from './pipeline';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { HostedZoneDelegate } from './constructs/delegate-wrapper';

export interface SharedLayerStackProps extends StackProps {
  readonly projectEnvironment: ProjectEnvironment
}

/**
  * Stack of constructs made in the shared account but need to match state with other accounts.
  */
export class SharedLayerStack extends Stack {
  public readonly hostedZone: IHostedZone;
  public readonly hostedZoneDelegate: HostedZoneDelegate;

  /**
    * Builds the stack with necessary resources and IAM roles.
    * @param{Construct} scope the parent, should be the project environment stage
    * @param{string} id the logical id of this resource
    * @param{SharedLayerStackProps} props the properties for this stack
    */
  constructor(scope: Construct, id: string, props: SharedLayerStackProps) {
    super(scope, id, { env: sharedEnvironment, ...props });

    this.hostedZone = HostedZone.fromHostedZoneId(
        this,
        'ChittyInsightsHostedZone',
        'Z0712659E60WG40V5EW7',
    );

    this.hostedZoneDelegate = new HostedZoneDelegate(
        this,
        `${props.projectEnvironment.name}HostedZoneDelegate`,
        {
          hostedZoneArn: this.hostedZone.hostedZoneArn,
          projectEnvironment: props.projectEnvironment,
        });
    this.hostedZone.grantDelegation(this.hostedZoneDelegate.delegationRole);
  }
}
