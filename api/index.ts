// Vercel serverless entry point. Keeping this source entry in /api lets
// Vercel bundle Express and all of its local dependencies with the function.
import app from '../server/src/serverless.js';

export default app;
