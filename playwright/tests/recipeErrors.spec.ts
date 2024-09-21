import { test, expect } from '@playwright/test';
import { updateData } from './recipeConstants';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

test('Read Non-existent Recipe', async ({ request }) => {
  const response = await request.get(`./recipes/${NIL_UUID}`);

  expect(response.status()).toEqual(404);
});

test('Update Non-existent Recipe', async ({ request }) => {
  const response = await request.patch(`./recipes/${NIL_UUID}`, { data: updateData });

  expect(response.status()).toEqual(404);
});

test('Delete Non-existent Recipe', async ({ request }) => {
  const response = await request.delete(`./recipes/${NIL_UUID}`);

  expect(response.status()).toEqual(404);
});
