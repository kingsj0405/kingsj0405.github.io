import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',  // Three.js 제외한 순수 로직만 테스트
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/model/**', 'src/rules/**', 'src/board/**'],
    },
  },
});
