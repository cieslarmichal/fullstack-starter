import { http, HttpResponse } from 'msw';

/**
 * MSW Handlers for API Mocking
 *
 * Mock API endpoints for testing purposes
 */

const API_BASE_URL = 'http://localhost:5000';

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/users/register`, async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string; password: string };

    return HttpResponse.json(
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: body.name,
        email: body.email,
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  http.post(`${API_BASE_URL}/users/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    // Simulate successful login
    if (body.email && body.password) {
      return HttpResponse.json({
        accessToken: 'mock-access-token',
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test User',
          email: body.email,
        },
      });
    }

    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  http.post(`${API_BASE_URL}/users/refresh`, () => {
    // Simulate no refresh token available (user not logged in)
    // This prevents act() warnings in tests by not triggering state updates
    return HttpResponse.json({ message: 'No refresh token available' }, { status: 401 });
  }),

  http.post(`${API_BASE_URL}/users/refresh-token`, () => {
    // Simulate no refresh token available (user not logged in)
    // This prevents act() warnings in tests by not triggering state updates
    return HttpResponse.json({ message: 'No refresh token available' }, { status: 401 });
  }),

  http.post(`${API_BASE_URL}/users/logout`, () => {
    return HttpResponse.json({}, { status: 204 });
  }),

  http.get(`${API_BASE_URL}/users/me`, () => {
    return HttpResponse.json({
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
    });
  }),
];
