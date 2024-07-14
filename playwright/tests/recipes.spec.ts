import { test, expect } from '@playwright/test';

const createData = {
  name: 'Playwright Recipe',
};

const updateData = {
  name: 'Updated Playwright Recipe',
};

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

let recipeUuid: string;

test('pingable', async ({ request }) => {
  const response = await request.get('./recipes/ping');

  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ msg: 'Pong' });
});

test.describe('Happy Path', () => {
  test.describe.configure({ mode: 'serial' });

  test('Create Recipe', async ({ request }) => {
    const response = await request.post('./recipes', { data: createData });

    expect(response.ok()).toBeTruthy();

    const responseBody = await response.json();
    expect(responseBody).toEqual({
      // eslint-disable-next-line max-len
      id: expect.stringMatching(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/),
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

  test('Delete Recipe', async ({ request }) => {
    const response = await request.delete(`./recipes/${recipeUuid}`);

    expect(response.status()).toEqual(204);
  });
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
