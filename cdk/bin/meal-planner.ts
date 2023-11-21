#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import MealPlannerStack from '../lib/meal-planner';

const app = new cdk.App();
new MealPlannerStack(app, 'MealPlannerStack');
