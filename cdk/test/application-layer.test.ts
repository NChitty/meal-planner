import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import ApplicationStack from '../lib/application-layer';
import PersistenceStack from '../lib/persistence-layer';
import SharedStack from '../lib/shared-layer';
import { ProjectEnvironment } from '../lib/pipeline';

describe('Application Layer Stack', () => {
  test('Synthesizes correctly', () => {
    const app = new App();

    // WHEN
    const projectEnvironment: ProjectEnvironment = {
      account: 'test',
      region: 'us-east-1',
      name: 'Test',
      subdomain: 'test',
    };

    const sharedStack = new SharedStack(app, 'TestSharedStack', { projectEnvironment });
    const persistenceStack = new PersistenceStack(app, 'TestPersistenceStack');

    const stack = new ApplicationStack(app, 'TestApplicationStack', {
      delegationRole: sharedStack.hostedZoneDelegate.delegationRole,
      domain: sharedStack.hostedZoneDelegate.normalizedDomain,
      parentHostedZoneId: sharedStack.hostedZone.hostedZoneId,
      recipeTable: persistenceStack.recipeTable,
    });

    // THEN
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::IAM::Role', {
      'AssumeRolePolicyDocument': {
        'Statement': [
          {
            'Action': 'sts:AssumeRole',
            'Effect': 'Allow',
            'Principal': {
              'Service': 'lambda.amazonaws.com',
            },
          },
        ],
        'Version': '2012-10-17',
      },
      'ManagedPolicyArns': [
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              {
                'Ref': 'AWS::Partition',
              },
              ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            ],
          ],
        },
      ],
    });

    template.hasResourceProperties('AWS::IAM::Policy', {
      'PolicyDocument': {
        'Statement': [
          {
            'Action': Match.arrayWith([
              'dynamodb:GetItem',
              'dynamodb:ConditionCheckItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
            ]),
            'Effect': 'Allow',
            'Resource': {
              'Fn::ImportValue':
                Match.stringLikeRegexp('TestPersistenceStack'),
            },
          },
        ],
        'Version': '2012-10-17',
      },
      'PolicyName': Match.stringLikeRegexp('MealPlannerFunctionServiceRoleDefaultPolicy'),
      'Roles': [
        {
          'Ref': Match.stringLikeRegexp('MealPlannerFunctionServiceRole'),
        },
      ],
    });

    template.hasResourceProperties('AWS::Lambda::Function', {
      'Code': {
        'ImageUri': {
          'Fn::Sub': Match.anyValue(),
        },
      },
      'Environment': {
        'Variables': {
          'AWS_LAMBDA_HTTP_IGNORE_STAGE_IN_PATH': 'true',
          'RECIPE_TABLE_NAME': {
            'Fn::ImportValue':
              Match.stringLikeRegexp('TestPersistenceStack'),
          },
        },
      },
      'FunctionName': 'MealPlannerFunction',
      'PackageType': 'Image',
    });

    template.hasResourceProperties('AWS::Route53::HostedZone', {
      'Name': `${projectEnvironment.subdomain}.projects.chittyinsights.com.`,
    });

    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      'DomainName': `api.${projectEnvironment.subdomain}.projects.chittyinsights.com`,
      'DomainValidationOptions': [
        {
          'DomainName': `api.${projectEnvironment.subdomain}.projects.chittyinsights.com`,
          'HostedZoneId': {
            'Ref': 'HostedZoneDB99F866',
          },
        },
      ],
      'Tags': [
        {
          'Key': 'Name',
          'Value': Match.stringLikeRegexp('TestApplicationStack\/Api\/ApiDomainCertificate'),
        },
      ],
      'ValidationMethod': 'DNS',
    });

    template.hasResourceProperties('AWS::Route53::RecordSet', {
      'AliasTarget': {
        'DNSName': {
          'Fn::GetAtt': [
            'Domain66AC69E0',
            'RegionalDomainName',
          ],
        },
        'HostedZoneId': {
          'Fn::GetAtt': [
            'Domain66AC69E0',
            'RegionalHostedZoneId',
          ],
        },
      },
      'HostedZoneId': {
        'Ref': 'HostedZoneDB99F866',
      },
      'Name': `api.${projectEnvironment.subdomain}.projects.chittyinsights.com.`,
      'Type': 'A',
    });

    template.hasResourceProperties('AWS::ApiGatewayV2::DomainName', {
      'DomainName': `api.${projectEnvironment.subdomain}.projects.chittyinsights.com`,
      'DomainNameConfigurations': [
        {
          'CertificateArn': {
            'Ref': Match.stringLikeRegexp('ApiApiDomainCertificate'),
          },
          'EndpointType': 'REGIONAL',
        },
      ],
    });

    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
      'DisableExecuteApiEndpoint': true,
      'Name': 'MealPlanner',
      'ProtocolType': 'HTTP',
    });

    template.hasResourceProperties('AWS::ApiGatewayV2::Integration', {
      'ApiId': {
        'Ref': Match.stringLikeRegexp('HttpApi'),
      },
      'IntegrationType': 'AWS_PROXY',
      'IntegrationUri': {
        'Fn::GetAtt': [
          Match.stringLikeRegexp('MealPlannerFunction'),
          'Arn',
        ],
      },
      'PayloadFormatVersion': '2.0',
    });

    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
      'ApiId': {
        'Ref': 'HttpApiF5A9A8A7',
      },
      'AuthorizationType': 'NONE',
      'RouteKey': '$default',
      'Target': {
        'Fn::Join': [
          '',
          [
            'integrations/',
            {
              'Ref': 'HttpApiDefaultRouteLambdaIntegrationC1A64CAE',
            },
          ],
        ],
      },
    });

    template.hasResourceProperties('AWS::ApiGatewayV2::Stage', {
      'ApiId': {
        'Ref': 'HttpApiF5A9A8A7',
      },
      'AutoDeploy': true,
      'StageName': '$default',
    });

    template.hasResourceProperties('AWS::ApiGatewayV2::ApiMapping', {
      'ApiId': {
        'Ref': 'HttpApiF5A9A8A7',
      },
      'ApiMappingKey': 'mealplanner',
      'DomainName': {
        'Ref': 'Domain66AC69E0',
      },
      'Stage': '$default',
    });
  });
});
