import { test, expect } from '@playwright/test';

const data = {
  name: 'Playwright Recipe',
};

let recipeUuid: string;

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
