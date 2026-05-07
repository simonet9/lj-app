/** @type {import('jest').Config} */
module.exports = {
  // ─── Timeout global (válido solo a nivel raíz, no dentro de projects[]) ──
  testTimeout: 30000,

  // ─── Global setup para variables de entorno ───────────────────────────────
  globalSetup: '<rootDir>/jest.global-setup.js',

  // ─── Proyectos separados: unit vs integration ─────────────────────────────
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/__tests__/unit/**/*.test.ts'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.test.json' }],
      },
      moduleNameMapper: {
        // Bloquear imports de React Native y polyfills que usan ESM en unit tests
        '^react-native$':                     '<rootDir>/__mocks__/react-native.js',
        '^react-native-url-polyfill.*$':      '<rootDir>/__mocks__/empty.js',
        '^@supabase/realtime-js':             '<rootDir>/__mocks__/empty.js',
        // Mockear supabase.ts para evitar el throw por env vars faltantes
        '^@services/supabase$':               '<rootDir>/__mocks__/supabase-client.js',
        '^@services/(.*)$':                   '<rootDir>/src/services/$1',
        '^@app-types/(.*)$':                  '<rootDir>/src/types/$1',
        '^@utils/(.*)$':                      '<rootDir>/src/utils/$1',
        '^@constants/(.*)$':                  '<rootDir>/src/constants/$1',
        '^@hooks/(.*)$':                      '<rootDir>/src/hooks/$1',
        '^@context/(.*)$':                    '<rootDir>/src/context/$1',
        '^@components/(.*)$':                 '<rootDir>/src/components/$1',
      },
    },
    {
      displayName: 'integration',
      testMatch: ['**/__tests__/integration/**/*.test.ts'],
      testEnvironment: 'node',
      // setupFilesAfterEnv: corre después de que el framework de test está instalado
      // (el nombre correcto en Jest 29; setupFilesAfterEach/Framework no existen)
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.test.json' }],
      },
      moduleNameMapper: {
        '^@services/(.*)$':   '<rootDir>/src/services/$1',
        '^@app-types/(.*)$':  '<rootDir>/src/types/$1',
        '^@utils/(.*)$':      '<rootDir>/src/utils/$1',
        '^@constants/(.*)$':  '<rootDir>/src/constants/$1',
        '^@hooks/(.*)$':      '<rootDir>/src/hooks/$1',
        '^@context/(.*)$':    '<rootDir>/src/context/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
      },
    },
  ],

  // ─── Cobertura ────────────────────────────────────────────────────────────
  collectCoverageFrom: [
    'src/services/cancelaciones.ts',
    'src/services/reservas.ts',
    'src/services/listaEspera.ts',
    'src/utils/fechas.ts',
  ],
  coverageThreshold: {
    global: { functions: 80, lines: 80 },
  },
};
