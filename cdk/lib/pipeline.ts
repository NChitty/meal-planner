import { Environment, Stack, StackProps, pipelines } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import MealPlannerStage from './application-stage';

export const stagingEnvironment: Environment = {
  account: '381491920629',
  region: 'us-east-1',
};

export const prodEnvironment: Environment = {
  account: '654654503876',
  region: 'us-east-1',
};

/**
  * Stack that holds pipeline.
  */
export default class PipelineStack extends Stack {
  /**
    * Constructor for the pipeline stack.
    * @param{Construct} scope the parent
    * @param{id} id the logical id of this construct
    * @param{StackProps} props properties for this stack
    */
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const synth = new pipelines.ShellStep('Synth', {
      /* eslint-disable max-len */
      input: pipelines.CodePipelineSource.connection('NChitty/meal-planner', 'feature/cicd/pipelines', {
        connectionArn: 'arn:aws:codestar-connections:us-east-1:654654503876:connection/a5ac8deb-b2ea-43bc-8b23-648adee88cdd',
      /* eslint-enable max-len */
      }),
      commands: [
        'cd cdk',
        'npm ci',
        'npm run build',
        'npx cdk synth',
      ],
    });

    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      synth,
      crossAccountKeys: true,
    });

    pipeline.addStage(new MealPlannerStage(this, 'MealPlannerAppProd', {
      env: prodEnvironment,
    }));
  }
}
