// Re-export auth storage utilities from lib/storage
// The NestJS REST API has been replaced by Convex — all data operations
// now go through convex/_generated/api via hooks in convex-api.ts
export { getToken, setToken } from './lib/storage';
