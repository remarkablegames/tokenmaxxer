/// <reference types="vite/client" />

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ImportMetaEnv {
  // readonly VITE_YOUR_ENV_VAR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
