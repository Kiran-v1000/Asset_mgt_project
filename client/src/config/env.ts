export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? '/api/v1',
  // Default to the in-memory mock so the UI runs with zero backend setup.
  useMock: (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false',
  appName: 'EAMS',
  appFullName: 'Enterprise Asset Management',
};
