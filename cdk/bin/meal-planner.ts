#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import MealPlannerStage from '../lib/application-stage';

export const stagingEnvironment: cdk.Environment = {
  account: '381491920629',
  region: 'us-east-1',
};

export const prodEnvironment: cdk.Environment = {
  account: '654654503876',
  region: 'us-east-1',
};
const app = new cdk.App();
new MealPlannerStage(app, 'MealPlannerApp', { env: prodEnvironment });
