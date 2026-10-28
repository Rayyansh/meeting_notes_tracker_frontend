/** Public, non-secret runtime config read from VITE_* variables. */
export const env = {
  useMockApi: (import.meta.env.VITE_USE_MOCK_API ?? 'true') !== 'false',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
  maxUploadKb: Number(import.meta.env.VITE_MAX_UPLOAD_KB ?? 512),
} as const
