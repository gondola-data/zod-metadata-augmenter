export type DATA_PROVIDER_CONNECTION =
  | DATA_PROVIDER_CONNECTION_DATABASE
  | DATA_PROVIDER_CONNECTION_API
  | DATA_PROVIDER_CONNECTION_FILE
  | DATA_PROVIDER_CONNECTION_STREAM
  | DATA_PROVIDER_CONNECTION_WEBPORTAL
  | DATA_PROVIDER_CONNECTION_DATA_WAREHOUSE
  | DATA_PROVIDER_CONNECTION_EMAIL_SERVICE
  | DATA_PROVIDER_CONNECTION_CUSTOM;

export type DATA_PROVIDER_CONNECTION_DATABASE = {
  host: string;
  port?: number;
  database?: string;
  schema?: string;
  connectionString?: string;
  ssl?: boolean;
  certificate?: string;
  warehouse?: string;
  role?: string;
  region?: string;
};

export type DATA_PROVIDER_CONNECTION_API = {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
  proxy?: string;
};

export const DATA_PROVIDER_CONNECTION_FILE_PROTOCOL: string[] = [
  "file",
  "sftp",
  "s3",
  "gcs",
  "azure",
  "http",
  "https",
];

export type DATA_PROVIDER_CONNECTION_FILE = {
  path: string;
  host?: string;
  port?: number;
  protocol: (typeof DATA_PROVIDER_CONNECTION_FILE_PROTOCOL)[number];
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
};

export type DATA_PROVIDER_CONNECTION_STREAM = {
  bootstrapServers: string;
  topic: string;
  groupId: string;
};

export type DATA_PROVIDER_CONNECTION_WEBPORTAL = {
  url: string;
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
};

export type DATA_PROVIDER_CONNECTION_DATA_WAREHOUSE = {
  host?: string;
  port?: number;
  account: string;
  database?: string;
  warehouse?: string;
  role?: string;
  region?: string;
  connectionString?: string;
};

export type DATA_PROVIDER_CONNECTION_MESSAGING_QUEUE = {
  bootstrapServers: string;
  topic: string;
  groupId: string;
};

export type DATA_PROVIDER_CONNECTION_EMAIL_SERVICE = {
  url: string;
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
};

export type DATA_PROVIDER_CONNECTION_CUSTOM = {
  connectionType: string;
  connectionConfig?: Record<string, unknown>;
};
