import { test, expect } from '@playwright/test';
import { createData, updateData } from './recipeConstants';


let recipeUuid: string;

test('pingable', async ({ request }) => {
  const response = await request.get('./recipes/ping');

  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ msg: 'Pong' });
});

test.describe('Happy Path', () => {
  test.describe.configure({ mode: 'serial' });

  test('Post Recipe', async ({ request }) => {
    const response = await request.post('./recipes', { data: createData });

    expect(response.status()).toBe(201);

    const responseBody = await response.json();
    expect(responseBody).toEqual({
      // eslint-disable-next-line max-len
      id: expect.stringMatching(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/),
      ...createData,
    });
    recipeUuid = responseBody.id;
  });

  test('Put Recipe', async ({ request }) => {
    const response = await request.put('./recipes', { data: { id: recipeUuid, ...createData } });

    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toEqual({
      id: recipeUuid,
      ...createData,
    });
    recipeUuid = responseBody.id;
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
