import { test, expect } from '@playwright/test';
import { NIL_UUID, updateData } from './recipeConstants';

test('Create Invalid Recipe', async ({ request }) => {
  const response = await request.put(`./recipes`, {
    data: {
      id: 'this-is-not-a-uuid',
      name: '',
    },
  });

  expect(response.status()).toEqual(422);
});

test('Create Recipe w/ Null Name', async ({ request }) => {
  const response = await request.put(`./recipes`, {
    data: {
      id: NIL_UUID,
    },
  });

  expect(response.status()).toEqual(422);
});

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
