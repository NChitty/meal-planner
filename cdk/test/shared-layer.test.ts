import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SharedLayerStack } from '../lib/shared-layer';
import { ProjectEnvironment } from '../lib/pipeline';

describe('Shared Layer Stack', () => {
  test('Provided Subdomain', () => {
    const app = new App();

    // WHEN
    const projectEnvironment: ProjectEnvironment = {
      account: 'test',
      region: 'us-east-1',
      name: 'Test',
      subdomain: 'test',
    };

    const stack = new SharedLayerStack(app, 'TestSharedStack', { projectEnvironment });

    // THEN
    const template = Template.fromStack(stack);

    console.log(template.toJSON());

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
              },
            ],
          },
          PolicyName: 'crossAccountPolicy',
        },
      ],
      RoleName: `${projectEnvironment.name}HostedZoneDelegationRole`,
    });

    template.hasResourceProperties('AWS::IAM::Policy', {
"PolicyDocument": {
          "Statement": [
            {
              "Action": "route53:ChangeResourceRecordSets",
              "Condition": {
                "ForAllValues:StringEquals": {
                  "route53:ChangeResourceRecordSetsRecordTypes": [
                    "NS"
                  ],
                  "route53:ChangeResourceRecordSetsActions": [
                    "UPSERT",
                    "DELETE"
                  ]
                }
              },
              "Effect": "Allow",
              "Resource": "arn:aws:route53:::hostedzone/Z0712659E60WG40V5EW7"
            },
            {
              "Action": "route53:ListHostedZonesByName",
              "Effect": "Allow",
              "Resource": "*"
            }
          ],
          "Version": "2012-10-17"
        },
        PolicyName: `${projectEnvironment.name}HostedZoneDelegationPolicy`,
        "Roles": [
          {
            "Ref": "StagingHostedZoneDelegateCrossAccountRole208CB1B4"
          }
        ]
      },
    });
  });
});
