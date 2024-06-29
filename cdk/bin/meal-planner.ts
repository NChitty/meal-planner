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

const devPersistence = new PersistenceLayerStack(app, 'DevPersistenceLayerStack');

new ApplicationLayerStack(app, 'DevApplicationLayerStack', {
  delegationRole: devShared.hostedZoneDelegate.delegationRole,
  parentHostedZoneId: devShared.hostedZone.hostedZoneId,
  domain: devShared.hostedZoneDelegate.normalizedDomain,
  recipeTable: devPersistence.recipeTable,
});
