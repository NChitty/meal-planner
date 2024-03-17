import { Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
  * Stack for stateful resources that are grouped to the deployment context
  */
export default class PersistenceLayerStack extends Stack {
  public readonly recipeTable: TableV2;

  /**
   * Constructs a stack meant for the image repository and other fixed resources.
   * @param{Construct} scope Parent construct
   * @param{string} id Logical ID
   * @param{StackProps} props properties for the stack
   */
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.recipeTable = new TableV2(this, 'RecipeTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      tableName: 'recipes',
    });
  }
}
