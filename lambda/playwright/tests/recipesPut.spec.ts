import { test, expect } from '@playwright/test';
import { createData, updateData } from './recipeConstants';

let recipeUuid: string = '01010101-0101-0101-0101-010101010101';

test('pingable', async ({ request }) => {
  const response = await request.get('./recipes/ping');

  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ msg: 'Pong' });
});

test.describe('Happy Path', () => {
  test.describe.configure({ mode: 'serial' });

  test('Put Recipe to create', async ({ request }) => {
    const response = await request.put('./recipes', { data: { id: recipeUuid, ...createData } });

    expect(response.status()).toBe(201);

    const responseBody = await response.json();
    expect(responseBody).toEqual({
      id: recipeUuid,
      ...createData,
    });
  });

  test('Read Recipe', async ({ request }) => {
    const response = await request.get(`./recipes/${recipeUuid}`);

    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toEqual({
      id: recipeUuid,
      ...createData,
    });
  });

  test('List Recipes', async ({ request }) => {
    const response = await request.get('./recipes');

    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json).toContainEqual({
      id: recipeUuid,
      ...createData,
    });
  });

  test('Put Recipe update', async ({ request }) => {
    const response = await request.put('./recipes', {
      data: {
        id: recipeUuid,
        name: 'PUT Update',
      },
    });

    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toEqual({
      id: recipeUuid,
      name: 'PUT Update',
    });
    recipeUuid = responseBody.id;
  });

  test('Update Recipe', async ({ request }) => {
    const response = await request.patch(`./recipes/${recipeUuid}`, { data: updateData });

    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toEqual({
      id: recipeUuid,
      ...updateData,
    });
  });

  test('Read Updated Recipe', async ({ request }) => {
    const response = await request.get(`./recipes/${recipeUuid}`);

    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toEqual({
      id: recipeUuid,
      ...updateData,
    });
  });

  test.afterAll('Delete Recipe', async ({ request }) => {
    const response = await request.delete(`./recipes/${recipeUuid}`);

    expect(response.status()).toEqual(204);
  });
});
