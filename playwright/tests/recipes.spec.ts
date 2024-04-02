import { test, expect } from '@playwright/test';

const data = {
  name: 'Playwright Recipe',
};
const NIL_UUID = '00000000-0000-0000-0000-000000000000';

let recipeUuid: string;

test.describe('Happy Path', () => {
  test.beforeAll('Create Recipe', async ({ request }) => {
    const response = await request.post('./recipes', { data });

    expect(response.ok()).toBeTruthy();

    const responseBody = await response.json();
    expect(responseBody).toEqual({
      // eslint-disable-next-line max-len
      id: expect.stringMatching(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/),
      ...data,
    });
    recipeUuid = responseBody.id;
  });

  test('Read Recipe', async ({ request }) => {
    const response = await request.get(`./recipes/${recipeUuid}`);

    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toEqual({
      id: recipeUuid,
      ...data,
    });
  });

  test.afterAll('Delete Recipe', async ({ request }) => {
    const response = await request.delete(`./recipes/${recipeUuid}`);

    expect(response.status()).toEqual(204);
  });
});

test('Read Non-existent Recipe', async ({ request }) => {
  const response = await request.get(`./recipes/${NIL_UUID}`);

  expect(response.status()).toEqual(404);
});

test('Delete Non-existent Recipe', async ({ request }) => {
  const response = await request.delete(`./recipes/${NIL_UUID}`);

  expect(response.status()).toEqual(404);
});
