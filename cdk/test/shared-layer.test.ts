import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import SharedStack from '../lib/shared-layer';
import { ProjectEnvironment } from '../lib/pipeline';

describe('Shared Layer Stack', () => {
  test('Synthesizes correctly with provided subdomain', () => {
    const app = new App();

    // WHEN
    const projectEnvironment: ProjectEnvironment = {
      account: 'test',
      region: 'us-east-1',
      name: 'Test',
      subdomain: 'test',
    };

    const stack = new SharedStack(app, 'TestSharedStack', { projectEnvironment });

    // THEN
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            'Action': 'sts:AssumeRole',
            'Effect': 'Allow',
          },
        ],
      },
      Policies: [
        {
          PolicyDocument: {
            Statement: [
              {
                'Action': 'route53:ListHostedZonesByName',
                'Effect': 'Allow',
                'Resource': '*',
                'Sid': 'ListHostedZonesByName',
              },
              {
                'Action': [
                  'route53:GetHostedZone',
                  'route53:ChangeResourceRecordSet',
                ],
                'Condition': {
                  'ForAllValues:StringLike': {
                    'route53:ChangeResourceRecordSetsNormalizedRecordNames': [
                      `${projectEnvironment.subdomain}.projects.chittyinsights.com`,
                    ],
                  },
                },
                'Effect': 'Allow',
                'Sid': 'GetHostedZoneAndChangeResourceRecordSet',
                'Resource': {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      { 'Ref': 'AWS::Partition' },
                      ':route53:::hostedzone/Z0712659E60WG40V5EW7',
                    ],
                  ],
                },
              },
            ],
          },
          PolicyName: 'crossAccountPolicy',
        },
      ],
      RoleName: `${projectEnvironment.name}HostedZoneDelegationRole`,
    });

    template.hasResourceProperties('AWS::IAM::Policy', {
      'PolicyDocument': {
        'Statement': [
          {
            'Action': 'route53:ChangeResourceRecordSets',
            'Condition': {
              'ForAllValues:StringEquals': {
                'route53:ChangeResourceRecordSetsRecordTypes': [
                  'NS',
                ],
                'route53:ChangeResourceRecordSetsActions': [
                  'UPSERT',
                  'DELETE',
                ],
              },
            },
            'Effect': 'Allow',
            'Resource': {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  { 'Ref': 'AWS::Partition' },
                  ':route53:::hostedzone/Z0712659E60WG40V5EW7',
                ],
              ],
            },
          },
          {
            'Action': 'route53:ListHostedZonesByName',
            'Effect': 'Allow',
            'Resource': '*',
          },
        ],
        'Version': '2012-10-17',
      },
      'PolicyName': Match.stringLikeRegexp(
          `${projectEnvironment.name}HostedZoneDelegateCrossAccountRoleDefaultPolicy`,
      ),
      'Roles': [
        {
          'Ref': Match.stringLikeRegexp(
              `${projectEnvironment.name}HostedZoneDelegateCrossAccountRole`,
          ),
        },
      ],
    });
  });

  test('Synthesizes correctly when not provided domain', () => {
    const app = new App();

    // WHEN
    const projectEnvironment: ProjectEnvironment = {
      account: 'test',
      region: 'us-east-1',
      name: 'Test',
    };

    const stack = new SharedStack(app, 'TestSharedStack', { projectEnvironment });

    // THEN
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            'Action': 'sts:AssumeRole',
            'Effect': 'Allow',
          },
        ],
      },
      Policies: [
        {
          PolicyDocument: {
            Statement: [
              {
                'Action': 'route53:ListHostedZonesByName',
                'Effect': 'Allow',
                'Resource': '*',
                'Sid': 'ListHostedZonesByName',
              },
              {
                'Action': [
                  'route53:GetHostedZone',
                  'route53:ChangeResourceRecordSet',
                ],
                'Condition': {
                  'ForAllValues:StringLike': {
                    'route53:ChangeResourceRecordSetsNormalizedRecordNames': [
                      'projects.chittyinsights.com',
                    ],
                  },
                },
                'Effect': 'Allow',
                'Sid': 'GetHostedZoneAndChangeResourceRecordSet',
                'Resource': {
                  'Fn::Join': [
                    '',
                    [
                      'arn:',
                      { 'Ref': 'AWS::Partition' },
                      ':route53:::hostedzone/Z0712659E60WG40V5EW7',
                    ],
                  ],
                },
              },
            ],
          },
          PolicyName: 'crossAccountPolicy',
        },
      ],
      RoleName: `${projectEnvironment.name}HostedZoneDelegationRole`,
    });

    template.hasResourceProperties('AWS::IAM::Policy', {
      'PolicyDocument': {
        'Statement': [
          {
            'Action': 'route53:ChangeResourceRecordSets',
            'Condition': {
              'ForAllValues:StringEquals': {
                'route53:ChangeResourceRecordSetsRecordTypes': [
                  'NS',
                ],
                'route53:ChangeResourceRecordSetsActions': [
                  'UPSERT',
                  'DELETE',
                ],
              },
            },
            'Effect': 'Allow',
            'Resource': {
              'Fn::Join': [
                '',
                [
                  'arn:',
                  { 'Ref': 'AWS::Partition' },
                  ':route53:::hostedzone/Z0712659E60WG40V5EW7',
                ],
              ],
            },
          },
          {
            'Action': 'route53:ListHostedZonesByName',
            'Effect': 'Allow',
            'Resource': '*',
          },
        ],
        'Version': '2012-10-17',
      },
      'PolicyName': Match.stringLikeRegexp(
          `${projectEnvironment.name}HostedZoneDelegateCrossAccountRoleDefaultPolicy`,
      ),
      'Roles': [
        {
          'Ref': Match.stringLikeRegexp(
              `${projectEnvironment.name}HostedZoneDelegateCrossAccountRole`,
          ),
        },
      ],
    });
  });
});
