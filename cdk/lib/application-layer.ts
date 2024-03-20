import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Code, Function, Handler, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import path = require('path');
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { Role } from 'aws-cdk-lib/aws-iam';
import {
  ARecord,
  CrossAccountZoneDelegationRecord,
  PublicHostedZone,
  RecordTarget,
} from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';

export interface ApplicationLayerStackProps extends StackProps {
  readonly delegationRole: Role;

  /**
    * The domain for where to host the api.
    */
  readonly domain: string;

  readonly parentHostedZone: string;

  /**
    * Table where the partition key refers to the top-level element of recipes.
    */
  readonly recipeTable: TableV2;
}

/**
 * Stack for deploying meal planner app.
 */
export default class ApplicationLayerStack extends Stack {
  /**
   * Construct a meal planner stack.
   * @param{Construct} scope not sure.
   * @param{string} id idk.
   * @param{StackProps} props the last thing?
   */
  constructor(scope: Construct, id: string, props: ApplicationLayerStackProps) {
    super(scope, id, props);

    const handler = new Function(this, 'MealPlannerFunction', {
      functionName: 'MealPlannerFunction',
      runtime: Runtime.FROM_IMAGE,
      code: Code.fromAssetImage(path.join(__dirname, '..', '..', 'lambda'), {
        assetName: 'meal-planner-api',
        target: 'meal-planner-api',
      }),
      handler: Handler.FROM_IMAGE,
      environment: {
        AWS_LAMBDA_HTTP_IGNORE_STAGE_IN_PATH: 'true',
        RECIPE_TABLE_NAME: props.recipeTable.tableName,
      },
      logRetention: RetentionDays.ONE_WEEK,
    });

    props.recipeTable.grantReadWriteData(handler);

    const hostedZone = new PublicHostedZone(this, 'HostedZone', {
      zoneName: props.domain,
    });

    new CrossAccountZoneDelegationRecord(this, 'Delegate', {
      delegatedZone: hostedZone,
      parentHostedZoneName: props.parentHostedZone,
      delegationRole: props.delegationRole,
    });

    const domainName = ['api.', props.domain].join();
    const certificate = new Certificate(this, 'ApiDomainCertificate', {
      domainName,
      validation: CertificateValidation.fromDns(hostedZone),
    });
    const api = new RestApi(this, 'MealPlannerApi', {
      domainName: {
        domainName,
        certificate,
        basePath: 'mealplanner',
      },
      disableExecuteApiEndpoint: true,
    });
    const lambdaIntegration = new LambdaIntegration(handler, {});
    const resource = api.root.addResource('mealplanner', {
      defaultIntegration: lambdaIntegration,
    });
    resource.addMethod('ANY');

    const apiDomainName = api.domainName || api.addDomainName('ApiDomainName', {
      domainName,
      certificate,
    });

    new ARecord(this, 'ApiAliasRecord', {
      zone: hostedZone,
      recordName: 'api',
      target: RecordTarget.fromAlias(new ApiGatewayDomain(apiDomainName)),
    });
  }
}
