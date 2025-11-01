import type { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Running global setup...');

  // Wait for backend to be ready
  const frontendURL = config.projects[0]?.use.baseURL || 'http://localhost:5173';
  const backendURL = 'http://localhost:5000';

  console.log('⏳ Waiting for services to be ready...');

  // Wait for backend health check
  await waitForService(backendURL + '/health', 30000);
  console.log('✅ Backend is ready');

  // Wait for frontend
  await waitForService(frontendURL, 30000);
  console.log('✅ Frontend is ready');

  console.log('✨ Global setup complete');
}

async function waitForService(url: string, timeout: number) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Service not ready yet, continue waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Service at ${url} did not become ready within ${timeout}ms`);
}

export default globalSetup;
