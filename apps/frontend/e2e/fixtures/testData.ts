export function generateUniqueEmail(): string {
  const timestamp = Date.now();
  return `test.user.${timestamp}@example.com`;
}
