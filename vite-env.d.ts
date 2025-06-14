interface ImportMetaEnv {
  readonly VITE_APPWRITE_PROJECT_ID: string;
  readonly VITE_APPWRITE_ENDPOINT: string;
  readonly VITE_APPWRITE_DBID: string;
  readonly VITE_APPWRITE_FOODENTRIESID: string;
  readonly VITE_APPWRITE_USERSETTINGSID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
