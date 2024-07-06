import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { ProjectEnvironment, sharedEnvironment } from './pipeline';
import { HostedZone, HostedZoneAttributes, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { HostedZoneDelegate } from './constructs/delegate-wrapper';

export interface SharedLayerStackProps extends StackProps {
  readonly projectEnvironment: ProjectEnvironment
}

/**
  * Stack of constructs made in the shared account but need to match state with other accounts.
  */
export default class SharedLayerStack extends Stack {
  readonly projectEnvironment: ProjectEnvironment;

  /**
    * Builds the stack with necessary resources and IAM roles.
    * @param{Construct} scope the parent, should be the project environment stage
    * @param{string} id the logical id of this resource
    * @param{SharedLayerStackProps} props the properties for this stack
    */
  constructor(scope: Construct, id: string, props: SharedLayerStackProps) {
    super(scope, id, { env: sharedEnvironment, ...props });

    this.projectEnvironment = props.projectEnvironment;
  }

  /**
    * Adds delegate role to given zone.
    *
    * @param{string} id The id for this resource
    * @param{HostedZoneAttributes} hostedZoneAttrs Attributes for lookup of hosted zone
    * @param{string} domain The domain that is being delegated to the parent
    *
    * @return{{hostedZone: IHostedZone, delegate: HostedZoneDelegate}} A composite object of the
    * parent zone and zone delegate wrapper.
    */
  readonly addDelegate = (id: string, hostedZoneAttrs: HostedZoneAttributes, domain?: string):
    { hostedZone: IHostedZone, delegate: HostedZoneDelegate } => {
    const hostedZone = HostedZone.fromHostedZoneAttributes(
        this,
        id,
        hostedZoneAttrs,
    );

    const delegate = new HostedZoneDelegate(
        this,
        `${this.projectEnvironment.name}${id}Delegate`,
        {
          hostedZoneArn: hostedZone.hostedZoneArn,
          projectEnvironment: this.projectEnvironment,
          domain,
        });

    hostedZone.grantDelegation(delegate.delegationRole);

    return {
      hostedZone,
      delegate,
    };
  };
}
