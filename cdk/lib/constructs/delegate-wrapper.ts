import { Construct } from 'constructs';
import {
  AccountPrincipal,
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
} from 'aws-cdk-lib/aws-iam';
import { ProjectEnvironment } from '../pipeline';

export interface HostedZoneDelegateProps {
  /**
    * The parent domain that the subdomain will be added to.
    */
  readonly domain?: string;

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
export class HostedZoneDelegate extends Construct {
  readonly defaultAccount: string = '211125587522';

  public readonly delegationRole: Role;
  public readonly normalizedDomain: string;

  /**
    * The construct containing the role.
    *
    * @param{Construct} scope the parent scope
    * @param{string} id logical id
    * @param{HostedZoneDelegateProps} props properties for this role
    */
  constructor(scope: Construct, id: string, props: HostedZoneDelegateProps) {
    super(scope, id);
    this.normalizedDomain = this.normalizeRecordName(
        props.projectEnvironment.subdomain,
        props.domain,
    );
    this.delegationRole = new Role(scope, `${id}CrossAccountRole`, {
      roleName: `${id}Role`,
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
    * @param{string | undefined} domain the parent hosted zone name
    * @return{string} The normalized domain name for future records
    */
  readonly normalizeRecordName = (subdomain?: string, domain?: string): string => {
    domain = domain ?? 'projects.chittyinsights.com';
    if (!subdomain) {
      return domain;
    }
    return subdomain.concat('.', domain);
  };
}
