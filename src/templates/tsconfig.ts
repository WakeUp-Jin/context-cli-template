/**
 * tsconfig.json 生成器
 */

export function generateTsConfig(): object {
  return {
    compilerOptions: {
      // 模块系统
      target: 'ES2022',
      module: 'ES2022',
      moduleResolution: 'node',

      // 输出配置
      outDir: './dist',
      rootDir: './src',

      // 严格模式
      strict: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,

      // ES Modules 支持
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,

      // 类型检查
      skipLibCheck: true,
      resolveJsonModule: true,

      // 装饰器
      experimentalDecorators: true,
      emitDecoratorMetadata: true,

      // 路径映射 (可选)
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', '**/*.test.ts'],
  };
}
