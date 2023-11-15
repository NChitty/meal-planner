#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
// import AppConfigStack from '../lib/stacks/appconfig';
import MealPlannerStack from '../lib/stacks/app';

const app = new App();
new MealPlannerStack(app, 'CDKTest');
