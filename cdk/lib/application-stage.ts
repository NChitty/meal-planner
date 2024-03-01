import { Construct } from 'constructs';
import { Stage, StageProps } from 'aws-cdk-lib';
import PersistenceLayerStack from './persistence-layer';
import ApplicationLayerStack from './application-layer';
/**
  * This is the full integration of the stacks.
  */
export default class MealPlannerStage extends Stage {
  /**
    * Creates a meal planner deployment stage.
    * @param{Construct} scope The parent construct.
    * @param{string} id the logical name of this stage.
    * @param{StageProps} props the properties of this resource.
    */
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    const persistanceLayer = new PersistenceLayerStack(this, 'RdsProxy');
    new ApplicationLayerStack(this, 'Lambda', {
      databaseCredentialsSecret: persistanceLayer.databaseCredentialsSecret,
      databaseUsername: persistanceLayer.databaseUsername,
      lambdaSecurityGroup: persistanceLayer.lambdaSecurityGroup,
      proxy: persistanceLayer.proxy,
      vpc: persistanceLayer.vpc,
    });
  }
}
