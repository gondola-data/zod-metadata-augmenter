export type DATA_PROVIDER_AUTHENTICATION =
  | DATA_PROVIDER_AUTHENTICATION_DATABASE
  | DATA_PROVIDER_AUTHENTICATION_API
  | DATA_PROVIDER_AUTHENTICATION_FILE
  | DATA_PROVIDER_AUTHENTICATION_STREAM
  | DATA_PROVIDER_AUTHENTICATION_WEB_PORTAL
  | DATA_PROVIDER_AUTHENTICATION_DATA_WAREHOUSE
  | DATA_PROVIDER_AUTHENTICATION_EMAIL_SERVICE
  | DATA_PROVIDER_AUTHENTICATION_CUSTOM;

export const DATA_PROVIDER_AUTHENTICATION_DATABASE_TYPES: string[] = [
  "basic",
  "oauth2",
  "kerberos",
  "ldap",
  "none",
];

export type DATA_PROVIDER_AUTHENTICATION_DATABASE = {
  type: (typeof DATA_PROVIDER_AUTHENTICATION_DATABASE_TYPES)[number];
  username?: string;
  password?: string;
  connectionString?: string;
  ssl?: boolean;
  certificate?: string;
  database?: string;
  warehouse?: string;
  role?: string;
  region?: string;
};

export const DATA_PROVIDER_AUTHENTICATION_API_TYPES: string[] = [
  "api_key",
  "oauth2",
  "basic",
  "bearer",
  "none",
];

export type DATA_PROVIDER_AUTHENTICATION_API = {
  type: (typeof DATA_PROVIDER_AUTHENTICATION_API_TYPES)[number];
  apiKey?: string;
  apiSecret?: string;
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
  refreshToken?: string;
  headers?: Record<string, string>;
};

export const DATA_PROVIDER_AUTHENTICATION_FILE_TYPES: string[] = [
  "none",
  "basic",
  "sftp",
  "s3",
  "gcs",
  "azure",
];

export type DATA_PROVIDER_AUTHENTICATION_FILE = {
  type: (typeof DATA_PROVIDER_AUTHENTICATION_FILE_TYPES)[number];
  username?: string;
  password?: string;
  host?: string;
  port?: number;
  path?: string;
  bucket?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
};

export const DATA_PROVIDER_AUTHENTICATION_STREAM_TYPES: string[] = [
  "none",
  "oauth2",
  "api_key",
  "sasl",
  "tls",
];

export const DATA_PROVIDER_AUTHENTICATION_STEAM_SECURITY_PROTOCOLS: string[] = [
  "PLAINTEXT",
  "SSL",
  "SASL_PLAINTEXT",
  "SASL_SSL",
];

export const DATA_PROVIDER_AUTHENTICATION_STREAM_SASL_MECHANISMS: string[] = [
  "GSSAPI",
  "PLAIN",
  "SCRAM-SHA-256",
  "SCRAM-SHA-512",
];

export type DATA_PROVIDER_AUTHENTICATION_STREAM = {
  type: (typeof DATA_PROVIDER_AUTHENTICATION_STREAM_TYPES)[number];
  apiKey?: string;
  apiSecret?: string;
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
  refreshToken?: string;
  headers?: Record<string, string>;
  securityProtocol?: (typeof DATA_PROVIDER_AUTHENTICATION_STEAM_SECURITY_PROTOCOLS)[number];
  saslMechanism?: (typeof DATA_PROVIDER_AUTHENTICATION_STREAM_SASL_MECHANISMS)[number];
  saslUsername?: string;
  saslPassword?: string;
};

export const DATA_PROVIDER_AUTHENTICATION_WEB_PORTAL_TYPES: string[] = [
  "oauth2",
  "saml",
  "basic",
  "mfa-otp",
  "none",
];

export type DATA_PROVIDER_AUTHENTICATION_WEB_PORTAL = {
  type: (typeof DATA_PROVIDER_AUTHENTICATION_WEB_PORTAL_TYPES)[number];
  url: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  samlEndpoint?: string;
  samlCertificate?: string;
  otpPasscode?: string;
};

export const DATA_PROVIDER_AUTHENTICATION_DATA_WAREHOUSE_TYPES: string[] = [
  "basic",
  "oauth2",
  "iam",
  "none",
];

export type DATA_PROVIDER_AUTHENTICATION_DATA_WAREHOUSE = {
  type: (typeof DATA_PROVIDER_AUTHENTICATION_DATA_WAREHOUSE_TYPES)[number];
  username?: string;
  password?: string;
  account?: string;
  database?: string;
  warehouse?: string;
  role?: string;
  iamRole?: string;
  region?: string;
};

export const DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE_TYPES: string[] = [
  "none",
  "oauth2",
  "api_key",
  "sasl",
  "tls",
];

export const DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE_SECURITY_PROTOCOLS: string[] =
  ["PLAINTEXT", "SSL", "SASL_PLAINTEXT", "SASL_SSL"];

export const DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE_SASL_MECHANISMS: string[] =
  ["GSSAPI", "PLAIN", "SCRAM-SHA-256", "SCRAM-SHA-512"];

export type DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE = {
  type: (typeof DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE_TYPES)[number];
  bootstrapServers: string;
  topic: string;
  groupId: string;
  securityProtocol?: (typeof DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE_SECURITY_PROTOCOLS)[number];
  saslMechanism?: (typeof DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE_SASL_MECHANISMS)[number];
  saslUsername?: string;
  saslPassword?: string;
};

export const DATA_PROVIDER_AUTHENTICATION_EMAIL_SERVICE_TYPES: string[] = [
  "none",
  "oauth2",
  "api_key",
  "basic",
];

export type DATA_PROVIDER_AUTHENTICATION_EMAIL_SERVICE = {
  type: (typeof DATA_PROVIDER_AUTHENTICATION_EMAIL_SERVICE_TYPES)[number];
  url: string;
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  username?: string;
  password?: string;
};

export type DATA_PROVIDER_AUTHENTICATION_CUSTOM = {
  type: "custom" | "none";
  customAuthType?: string;
  customAuthConfig?: Record<string, unknown>;
};
