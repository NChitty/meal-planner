import { Construct } from 'constructs';
import { DomainName, HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ARecord, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { ApiGatewayv2DomainProperties } from 'aws-cdk-lib/aws-route53-targets';

export interface MealPlannerHttpApiProps {
  readonly domain: string;
  readonly hostedZone: IHostedZone;
  readonly lambda: IFunction;
}

/**
  * Construct for building HttpApi.
  */
export class MealPlannerHttpApi extends Construct {
  /**
    * Builds an HttpApi.
    * @param{Construct} scope the parent scope
    * @param{string} id the logical id
    * @param{MealPlannerHttpApiProps} props properties
    */
  constructor(scope: Construct, id: string, props: MealPlannerHttpApiProps) {
    super(scope, id);
    const lambda = new HttpLambdaIntegration('LambdaIntegration', props.lambda);
    const domainName = ['api', props.domain].join('.');
    const certificate = new Certificate(this, 'ApiDomainCertificate', {
      domainName,
      validation: CertificateValidation.fromDns(props.hostedZone),
    });
    const domain = new DomainName(scope, 'Domain', {
      domainName,
      certificate,
    });
    new ARecord(this, 'ApiAliasRecord', {
      zone: props.hostedZone,
      recordName: 'api',
      target: RecordTarget.fromAlias(new ApiGatewayv2DomainProperties(
          domain.regionalDomainName,
          domain.regionalHostedZoneId,
      )),
    });
    new HttpApi(scope, 'Api', {
      defaultIntegration: lambda,
      defaultDomainMapping: {
        domainName: domain,
        mappingKey: 'mealplanner',
      },
      disableExecuteApiEndpoint: true,
    });
  }
}
