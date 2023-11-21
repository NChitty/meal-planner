#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import Stack from '../lib/infrastructure-stack';

const app = new cdk.App();
new Stack(app, 'MealPlannerStack', {
  gitHubRoleArn: 'arn:aws:iam::416327764979:role/GitHubWorkflow-Role-at0eDb5aItgL',
});
