import { fileURLToPath } from 'node:url';
export default { outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)), distDir: process.env.NEXT_BUILD_DIR || '.next' };
