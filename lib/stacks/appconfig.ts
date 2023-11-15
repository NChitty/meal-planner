import { Fn, Stack, StackProps } from 'aws-cdk-lib';
import console = require('console');
import {
  CfnApplication as Application,
  CfnEnvironment as Environment,
  CfnConfigurationProfile as Configuration,
} from 'aws-cdk-lib/aws-appconfig';
import { ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CfnParameter as Parameter } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Props for appconfig stack
 */
export interface AppConfigStackProps extends StackProps {
  environments?: string[],
}

/**
 * Create a stack the builds out app config resources.
 */
export default class AppConfigStack extends Stack {
  /**
   * Construct app config resources.
   * @param{Construct} scope
   * @param{string} id
   * @param{StackProps} props
   */
  constructor(scope: Construct, id: string, props: AppConfigStackProps) {
    super(scope, id, props);

    const appName = new Parameter(this, 'AppName', {
      type: 'String',
      description: 'Choose a name for this application. Default: \'defaultApp\'',
      default: 'defaultApp',
    });
    const appDesc = new Parameter(this, 'AppDescription', {
      type: 'String',
      description: 'Create a description for this application. Default: No description available',
      default: 'No description available',
    });

    const application = new Application(this, 'app', {
      name: appName.valueAsString,
      description: appDesc.valueAsString,
    });

    createEnvironments(
        this,
        application,
        props.environments ? props.environments : ['dev', 'beta', 'prod'],
    );

    createManagedPolicies(
        this,
        application,
        props.environments ? props.environments : ['dev', 'beta', 'prod'],
    );

    new Configuration(this, 'featureFlagConfig', {
      applicationId: application.ref,
      name: 'features',
      locationUri: 'hosted',
      type: 'AWS.AppConfig.FeatureFlags',
    }).addDependency(application);

    new Configuration(this, 'freeFormConfig', {
      applicationId: application.ref,
      name: 'config',
      locationUri: 'hosted',
      type: 'AWS.Freeform',
    }).addDependency(application);
  }
}

const createEnvironments = (scope: Construct, app: Application, environments: string[]) => {
  environments.forEach((environment) => {
    new Environment(scope, `${capitalizeFirstLetter(environment)}Env`, {
      applicationId: app.ref,
      name: environment,
    });
  });
};

const createManagedPolicies = (scope: Construct, app: Application, environments: string[]) => {
  environments.forEach((environment) => {
    new ManagedPolicy(scope, `${capitalizeFirstLetter(environment)}Policy`, {
      managedPolicyName: `AppConfig_App${capitalizeFirstLetter(app.name)}` +
          `_Environment${capitalizeFirstLetter(environment)}_Configuration`,
      statements: [
        new PolicyStatement({
          actions: [
            'appconfig:StartConfigurationSession',
            'appconfig:GetLatestConfiguration',
          ],
          resources: [
            Stack.of(scope).formatArn({
              service: 'appconfig',
              resource: `application/${app.name}/environment/${environment}/configuration/*`,
            }),
          ],
        }),
      ],
    });
  });
};

const capitalizeFirstLetter = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
