import { Construct } from 'constructs';
import { Stage, StageProps } from 'aws-cdk-lib';
import PersistenceLayerStack from './persistence-layer';
import ApplicationLayerStack from './application-layer';
import { ProjectEnvironment } from './pipeline';
import { SharedLayerStack } from './shared-layer';

export interface MealPlannerStageProps extends StageProps {
  readonly env: ProjectEnvironment;
}

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
  constructor(scope: Construct, id: string, props: MealPlannerStageProps) {
    super(scope, id, props);

    const sharedLayer = new SharedLayerStack(this, 'SharedLayer', {
      projectEnvironment: props.env,
    });
    const persistanceLayer = new PersistenceLayerStack(this, 'PersistenceLayer');
    new ApplicationLayerStack(this, 'ApplicationLayer', {
      delegationRole: sharedLayer.hostedZoneDelegate.delegationRole,
      recipeTable: persistanceLayer.recipeTable,
      domain: sharedLayer.hostedZoneDelegate.normalizedDomain,
      parentHostedZoneId: sharedLayer.hostedZone.hostedZoneId,
    });
  }
}
