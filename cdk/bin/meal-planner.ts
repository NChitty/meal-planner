#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import PipelineStack from '../lib/pipeline';
import * as pipeline from '../lib/pipeline';

const app = new cdk.App();
new PipelineStack(app, 'MealPlannerPipeline', {
  env: pipeline.sharedEnvironment,
});
