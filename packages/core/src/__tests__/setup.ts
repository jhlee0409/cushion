// Test setup file
import { afterEach, beforeEach, vi } from 'vitest';

// Mock fetch globally with proper typing
global.fetch = vi.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
    clone: () => ({ 
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('')
    })
  } as Response)
);

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks();
});