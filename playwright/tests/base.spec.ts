import { test, expect } from '@playwright/test';

test('pingable', async ({ request }) => {
  const response = await request.get('./ping');

  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({ msg: 'Pong' });
});
