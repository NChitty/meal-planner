import { Construct } from 'constructs';
import { Stage, StageProps } from 'aws-cdk-lib';
import PersistenceLayerStack from './persistence-layer';
import ApplicationLayerStack from './application-layer';
import { ProjectEnvironment } from './pipeline';
import SharedLayerStack from './shared-layer';

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

    sharedLayer.addDelegate('ChittyInsightsComHostedZone', {
      zoneName: 'chittyinsights.com',
      hostedZoneId: 'Z0712659E60WG40V5EW7',
    });

    const { hostedZone, delegate } = sharedLayer.addDelegate(
        'ChittyInsightsDevHostedZone',
        {
          zoneName: 'chittyinsights.dev',
          hostedZoneId: 'Z05171022TE0L7DEAZTUK',
        },
        'mealplanner.chittyinsights.dev',
    );

    const persistanceLayer = new PersistenceLayerStack(this, 'PersistenceLayer');
    new ApplicationLayerStack(this, 'ApplicationLayer', {
      delegationRole: delegate.delegationRole,
      recipeTable: persistanceLayer.recipeTable,
      domain: delegate.normalizedDomain,
      parentHostedZoneId: hostedZone.hostedZoneId,
    });
  }
}
