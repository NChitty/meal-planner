import { test, expect } from '@playwright/test';

test('pingable', async ({ request }) => {
  const response = await request.get('/ping');

  expect(response.ok()).toBeTruthy();
});

test('hello world', async ({ request }) => {
  const response = await request.get('');

  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ msg: 'Hello world!' });
});

test('hello name', async ({ request }) => {
  const name = 'Nicholas';
  const response = await request.get('', {
    params: {
      'name': name,
    },
  });

  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ msg: `Hello ${name}!` });
});
