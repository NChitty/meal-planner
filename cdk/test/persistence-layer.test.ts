import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import PersistenceStack from '../lib/persistence-layer';

test('Recipe table created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new PersistenceStack(app, 'TestPersistenceStack');
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::GlobalTable', {
    TableName: 'recipes',
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
    ],
  });
});
