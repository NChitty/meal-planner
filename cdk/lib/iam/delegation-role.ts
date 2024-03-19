import { Construct } from 'constructs';
import {
  AccountPrincipal,
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
} from 'aws-cdk-lib/aws-iam';
import { ProjectEnvironment } from '../pipeline';

export interface HostedZoneDelegationProps {
  /**
    * The parent hosted zone arn.
    */
  readonly hostedZoneArn: string;

  /**
    * The environment this role is meant for, prevents accounts from being able to delegate records
    * for other accounts.
    */
  readonly projectEnvironment: ProjectEnvironment;
}

/**
  * Wrapper that builds a role to allow delegation of subdomain records to another account.
  */
export class HostedZoneDelegationRole extends Construct {
  readonly defaultAccount: string = '211125587522';
  readonly defaultDomain: string = 'mealplanner.projects.chittyinsights.com';

  public readonly delegationRole: Role;
  public readonly normalizedDomain: string;

  /**
    * The construct containing the role.
    *
    * @param{Construct} scope the parent scope
    * @param{string} id logical id
    * @param{HostedZoneDelegationProps} props properties for this role
    */
  constructor(scope: Construct, id: string, props: HostedZoneDelegationProps) {
    super(scope, id);
    this.normalizedDomain = this.normalizeRecordName(props.projectEnvironment.subdomain);
    this.delegationRole = new Role(this, 'CrossAccountRole', {
      roleName: `${props.projectEnvironment.name}HostedZoneDelegationRole`,
      assumedBy: new AccountPrincipal(`${props.projectEnvironment.account || this.defaultAccount}`),
      inlinePolicies: {
        crossAccountPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              sid: 'ListHostedZonesByName',
              effect: Effect.ALLOW,
              actions: ['route53:ListHostedZonesByName'],
              resources: ['*'],
            }),
            new PolicyStatement({
              sid: 'GetHostedZoneAndChangeResourceRecordSet',
              effect: Effect.ALLOW,
              actions: ['route53:GetHostedZone', 'route53:ChangeResourceRecordSet'],
              resources: [props.hostedZoneArn],
              conditions: {
                'ForAllValues:StringLike': {
                  'route53:ChangeResourceRecordSetsNormalizedRecordNames': [this.normalizedDomain],
                },
              },
            }),
          ],
        }),
      },
    });
  }

  /**
    * Builds the normalized record name based on logic.
    * @param{string | undefined} subdomain the subdomain to allow editting for
    * @return{string} The normalized domain name for future records
    */
  readonly normalizeRecordName = (subdomain?: string): string => {
    if (!subdomain) {
      return this.defaultDomain;
    }
    return subdomain.concat('.', this.defaultDomain);
  };
}
