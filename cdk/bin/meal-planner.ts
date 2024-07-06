#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import PipelineStack, { ProjectEnvironment, sharedEnvironment } from '../lib/pipeline';
import ApplicationLayerStack from '../lib/application-layer';
import PersistenceLayerStack from '../lib/persistence-layer';
import SharedLayerStack from '../lib/shared-layer';

const app = new cdk.App();

new PipelineStack(app, 'MealPlannerPipeline', {
  env: sharedEnvironment,
});

const projectEnvironment: ProjectEnvironment = {
  account: process.env.AWS_SANDBOX_ACCOUNT || '211125429662',
  region: process.env.AWS_SANDBOX_REGION || 'us-east-1',
  name: process.env.MEAL_PLANNER_PROJECT_NAME || 'Sandbox',
  subdomain: process.env.MEAL_PLANNER_PROJECT_SUBDOMAIN || 'sandbox',
};

const devShared = new SharedLayerStack(app, 'DevSharedLayerStack', {
  projectEnvironment,
});

const { hostedZone, delegate } = devShared.addDelegate(
    'ChittyInsightsDevHostedZone',
    {
      zoneName: 'chittyinsights.dev',
      hostedZoneId: 'Z05171022TE0L7DEAZTUK',
    },
    'mealplanner.chittyinsights.dev',
);

const devPersistence = new PersistenceLayerStack(app, 'DevPersistenceLayerStack');

new ApplicationLayerStack(app, 'DevApplicationLayerStack', {
  delegationRole: delegate.delegationRole,
  parentHostedZoneId: hostedZone.hostedZoneId,
  domain: delegate.normalizedDomain,
  recipeTable: devPersistence.recipeTable,
});
