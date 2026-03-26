import * as z from "zod";

import {
  DATA_PROVIDER_TYPES,
  DATA_PROVIDER_FORMATS,
  DATA_PROVIDER_PRODUCT_LIFE_CYCLES,
  DATA_PROVIDER_PRODUCT_STATUS,
} from "./types/data-provider";

import {
  DATA_PROVIDER_AUTHENTICATION_DATABASE_TYPES,
  DATA_PROVIDER_AUTHENTICATION_API_TYPES,
  DATA_PROVIDER_AUTHENTICATION_FILE_TYPES,
  DATA_PROVIDER_AUTHENTICATION_STREAM_TYPES,
  DATA_PROVIDER_AUTHENTICATION_STEAM_SECURITY_PROTOCOLS,
  DATA_PROVIDER_AUTHENTICATION_STREAM_SASL_MECHANISMS,
  DATA_PROVIDER_AUTHENTICATION_WEB_PORTAL_TYPES,
  DATA_PROVIDER_AUTHENTICATION_DATA_WAREHOUSE_TYPES,
  DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE_TYPES,
  DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE_SECURITY_PROTOCOLS,
  DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE_SASL_MECHANISMS,
  DATA_PROVIDER_AUTHENTICATION_EMAIL_SERVICE_TYPES,
} from "./types/data-provider-auth";

import { DATA_PROVIDER_CONNECTION_FILE_PROTOCOL } from "./types/data-provider-connection";

const DataProviderPersonasSchema = z.object({
  name: z.string().meta({
    rank: 0,
  }),
  function: z.string().meta({
    rank: 1,
  }),
  email: z.email().meta({
    rank: 2,
  }),
});

const DataProviderLifeCycleSchema = z.object({
  status: z.enum(DATA_PROVIDER_PRODUCT_LIFE_CYCLES).meta({
    rank: 0,
  }),
  effectiveDate: z.iso.date().meta({
    rank: 1,
  }),
  note: z.string().meta({
    rank: 2,
  }),
});

const DataProviderProductStatusSchema = z.object({
  status: z.enum(DATA_PROVIDER_PRODUCT_STATUS).meta({
    rank: 0,
  }),
  effectiveDate: z.iso.date().meta({
    rank: 1,
  }),
});

const DataProviderAuthenticationDatabaseSchema = z.object({
  type: z.enum(DATA_PROVIDER_AUTHENTICATION_DATABASE_TYPES).meta({
    rank: 0,
  }),
  username: z.string().optional().meta({
    rank: 1,
  }),
  password: z.string().optional().meta({
    rank: 2,
  }),
  connectionString: z.string().optional().meta({
    rank: 3,
  }),
  ssl: z.boolean().optional().meta({
    rank: 4,
  }),
  certificate: z.string().optional().meta({
    rank: 5,
  }),
  database: z.string().optional().meta({
    rank: 6,
  }),
  warehouse: z.string().optional().meta({
    rank: 7,
  }),
  role: z.string().optional().meta({
    rank: 8,
  }),
  region: z.string().optional().meta({
    rank: 9,
  }),
  dataProviderType: z.literal("Database").meta({
    rank: 10,
  }),
});

const DataProviderConnectionDatabaseSchema = z.object({
  host: z.string().meta({
    rank: 0,
  }),
  port: z.number().optional().meta({
    rank: 1,
  }),
  database: z.string().optional().meta({
    rank: 2,
  }),
  schema: z.string().optional().meta({
    rank: 3,
  }),
  connectionString: z.string().optional().meta({
    rank: 4,
  }),
  ssl: z.boolean().optional().meta({
    rank: 5,
  }),
  certificate: z.string().optional().meta({
    rank: 6,
  }),
  warehouse: z.string().optional().meta({
    rank: 7,
  }),
  role: z.string().optional().meta({
    rank: 8,
  }),
  region: z.string().optional().meta({
    rank: 9,
  }),
  dataProviderType: z.literal("Database").meta({
    rank: 10,
  }),
});

const DataProviderAuthenticationApiSchema = z.object({
  type: z.enum(DATA_PROVIDER_AUTHENTICATION_API_TYPES).meta({
    rank: 0,
  }),
  apiKey: z.string().optional().meta({
    rank: 1,
  }),
  apiSecret: z.string().optional().meta({
    rank: 2,
  }),
  clientId: z.string().optional().meta({
    rank: 3,
  }),
  clientSecret: z.string().optional().meta({
    rank: 4,
  }),
  tokenUrl: z.url().optional().meta({
    rank: 5,
  }),
  refreshToken: z.string().optional().meta({
    rank: 6,
  }),
  headers: z.record(z.string(), z.string()).optional().meta({
    rank: 7,
  }),
  dataProviderType: z.literal("API").meta({
    rank: 8,
  }),
});

const DataProviderConnectionApiSchema = z.object({
  baseUrl: z.string().meta({
    rank: 0,
  }),
  timeout: z.number().optional().meta({
    rank: 1,
  }),
  headers: z.record(z.string(), z.string()).optional().meta({
    rank: 2,
  }),
  proxy: z.string().optional().meta({
    rank: 3,
  }),
  dataProviderType: z.literal("API").meta({
    rank: 4,
  }),
});

const DataProviderAuthenticationFileSchema = z.object({
  type: z.enum(DATA_PROVIDER_AUTHENTICATION_FILE_TYPES).meta({
    rank: 0,
  }),
  username: z.string().optional().meta({
    rank: 1,
  }),
  password: z.string().optional().meta({
    rank: 2,
  }),
  host: z.string().optional().meta({
    rank: 3,
  }),
  port: z.number().optional().meta({
    rank: 4,
  }),
  path: z.string().optional().meta({
    rank: 5,
  }),
  bucket: z.string().optional().meta({
    rank: 6,
  }),
  region: z.string().optional().meta({
    rank: 7,
  }),
  accessKey: z.string().optional().meta({
    rank: 8,
  }),
  secretKey: z.string().optional().meta({
    rank: 9,
  }),
  dataProviderType: z.literal("File/ Blob").meta({
    rank: 10,
  }),
});

const DataProviderConnectionFileSchema = z.object({
  path: z.string().meta({
    rank: 0,
  }),
  host: z.string().optional().meta({
    rank: 1,
  }),
  port: z.number().optional().meta({
    rank: 2,
  }),
  protocol: z.enum(DATA_PROVIDER_CONNECTION_FILE_PROTOCOL).meta({
    rank: 3,
  }),
  bucket: z.string().optional().meta({
    rank: 4,
  }),
  region: z.string().optional().meta({
    rank: 5,
  }),
  accessKey: z.string().optional().meta({
    rank: 6,
  }),
  secretKey: z.string().optional().meta({
    rank: 7,
  }),
  dataProviderType: z.literal("File/ Blob").meta({
    uri: "#/taxonomy/concept/data-provider/connection/item/file/resource/dataProviderType",
    rank: 8,
  }),
});

const DataProviderAuthenticationStreamSchema = z.object({
  type: z.enum(DATA_PROVIDER_AUTHENTICATION_STREAM_TYPES).meta({
    rank: 0,
  }),
  apiKey: z.string().optional().meta({
    rank: 1,
  }),
  apiSecret: z.string().optional().meta({
    rank: 2,
  }),
  clientId: z.string().optional().meta({
    rank: 3,
  }),
  clientSecret: z.string().optional().meta({
    rank: 4,
  }),
  tokenUrl: z.string().optional().meta({
    rank: 5,
  }),
  refreshToken: z.string().optional().meta({
    rank: 6,
  }),
  headers: z.record(z.string(), z.string()).optional().meta({
    rank: 7,
  }),
  securityProtocol: z
    .enum(DATA_PROVIDER_AUTHENTICATION_STEAM_SECURITY_PROTOCOLS)
    .optional()
    .meta({
      rank: 8,
    }),
  saslMechanism: z
    .enum(DATA_PROVIDER_AUTHENTICATION_STREAM_SASL_MECHANISMS)
    .optional()
    .meta({
      rank: 9,
    }),
  saslUsername: z.string().optional().meta({
    rank: 10,
  }),
  saslPassword: z.string().optional().meta({
    rank: 11,
  }),
  dataProviderType: z.literal("Stream").meta({
    rank: 12,
  }),
});

const DataProviderConnectionStreamSchema = z.object({
  bootstrapServers: z.string().meta({
    rank: 0,
  }),
  topic: z.string().meta({
    rank: 1,
  }),
  groupId: z.string().meta({
    rank: 2,
  }),
  dataProviderType: z.literal("Stream").meta({
    rank: 3,
  }),
});

const DataProviderAuthenticationWebPortalSchema = z.object({
  type: z.enum(DATA_PROVIDER_AUTHENTICATION_WEB_PORTAL_TYPES).meta({
    rank: 0,
  }),
  url: z.url().optional().meta({
    rank: 1,
  }),
  clientId: z.string().optional().meta({
    rank: 2,
  }),
  clientSecret: z.string().optional().meta({
    rank: 3,
  }),
  redirectUri: z.string().optional().meta({
    rank: 4,
  }),
  samlEndpoint: z.string().optional().meta({
    rank: 5,
  }),
  samlCertificate: z.string().optional().meta({
    rank: 6,
  }),
  otpPasscode: z.string().optional().meta({
    rank: 7,
  }),
  dataProviderType: z.literal("Web Portal").meta({
    rank: 8,
  }),
});

const DataProviderConnectionWebPortalSchema = z.object({
  type: z.enum(DATA_PROVIDER_AUTHENTICATION_WEB_PORTAL_TYPES).meta({
    rank: 0,
  }),
  url: z.url().optional().meta({
    rank: 1,
  }),
  dataProviderType: z.literal("Web Portal").meta({
    rank: 2,
  }),
});

const DataProviderAuthenticationDataWarehouseSchema = z.object({
  type: z.enum(DATA_PROVIDER_AUTHENTICATION_DATA_WAREHOUSE_TYPES).meta({
    rank: 0,
  }),
  username: z.string().optional().meta({
    rank: 1,
  }),
  password: z.string().optional().meta({
    rank: 2,
  }),
  account: z.string().optional().meta({
    rank: 3,
  }),
  database: z.string().optional().meta({
    rank: 4,
  }),
  warehouse: z.string().optional().meta({
    rank: 5,
  }),
  role: z.string().optional().meta({
    rank: 6,
  }),
  iamRole: z.string().optional().meta({
    rank: 7,
  }),
  region: z.string().optional().meta({
    rank: 8,
  }),
  dataProviderType: z.literal("Data Warehouse").meta({
    rank: 9,
  }),
});

const DataProviderConnectionDataWarehouseSchema = z.object({
  host: z.string().optional().meta({
    rank: 0,
  }),
  port: z.number().optional().meta({
    rank: 1,
  }),
  account: z.string().meta({
    rank: 2,
  }),
  database: z.string().meta({
    rank: 3,
  }),
  warehouse: z.string().meta({
    rank: 4,
  }),
  role: z.string().meta({
    rank: 5,
  }),
  region: z.string().optional().meta({
    rank: 6,
  }),
  connectionString: z.string().optional().meta({
    rank: 7,
  }),
  dataProviderType: z.literal("Data Warehouse").meta({
    rank: 8,
  }),
});

const DataProviderAuthenticationMessagingQueueSchema = z.object({
  type: z.enum(DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE_TYPES).meta({
    rank: 0,
  }),
  bootstrapServers: z.string().optional().meta({
    rank: 1,
  }),
  topic: z.string().optional().meta({
    rank: 2,
  }),
  groupId: z.string().optional().meta({
    rank: 3,
  }),
  securityProtocol: z
    .enum(DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE_SECURITY_PROTOCOLS)
    .optional()
    .meta({
      rank: 4,
    }),
  saslMechanism: z
    .enum(DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE_SASL_MECHANISMS)
    .optional()
    .meta({
      rank: 5,
    }),
  saslUsername: z.string().optional().meta({
    rank: 6,
  }),
  saslPassword: z.string().optional().meta({
    rank: 7,
  }),
  dataProviderType: z.literal("Messaging Queue").meta({
    rank: 8,
  }),
});

const DataProviderConnectionMessagingQueueSchema = z.object({
  bootstrapServers: z.string().optional().meta({
    rank: 0,
  }),
  topic: z.string().optional().meta({
    rank: 1,
  }),
  groupId: z.string().optional().meta({
    rank: 2,
  }),
  securityProtocol: z
    .enum(DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE_SECURITY_PROTOCOLS)
    .optional()
    .meta({
      rank: 3,
    }),
  saslMechanism: z
    .enum(DATA_PROVIDER_AUTHENTICATION_MESSAGING_QUEUE_SASL_MECHANISMS)
    .optional()
    .meta({
      rank: 4,
    }),
  saslUsername: z.string().optional().meta({
    rank: 5,
  }),
  saslPassword: z.string().optional().meta({
    rank: 6,
  }),
  dataProviderType: z.literal("Messaging Queue").meta({
    rank: 7,
  }),
});

const DataProviderAuthenticationEmailServiceSchema = z.object({
  type: z.enum(DATA_PROVIDER_AUTHENTICATION_EMAIL_SERVICE_TYPES).meta({
    rank: 0,
  }),
  url: z.string().optional().meta({
    rank: 1,
  }),
  clientId: z.string().optional().meta({
    rank: 2,
  }),
  clientSecret: z.string().optional().meta({
    rank: 3,
  }),
  apiKey: z.string().optional().meta({
    rank: 4,
  }),
  username: z.string().optional().meta({
    rank: 5,
  }),
  password: z.string().optional().meta({
    rank: 6,
  }),
  dataProviderType: z.literal("Email Service").meta({
    rank: 7,
  }),
});

const DataProviderConnectionEmailServiceSchema = z.object({
  url: z.string().meta({
    rank: 0,
  }),
  baseUrl: z.string().optional().meta({
    rank: 1,
  }),
  timeout: z.number().optional().meta({
    rank: 2,
  }),
  headers: z.record(z.string(), z.string()).optional().meta({
    rank: 3,
  }),
  dataProviderType: z.literal("Email Service").meta({
    rank: 4,
  }),
});

const DataProviderAuthenticationCustomSchema = z.object({
  type: z.enum(["custom", "none"]).meta({
    rank: 0,
  }),
  customAuthType: z.string().optional().meta({
    rank: 1,
  }),
  customAuthConfig: z.record(z.string(), z.string()).optional().meta({
    rank: 2,
  }),
  dataProviderType: z.literal("Custom").meta({
    rank: 3,
  }),
});

const DataProviderConnectionCustomSchema = z.object({
  connectionType: z.string().meta({
    rank: 0,
  }),
  connectionConfig: z.record(z.string(), z.string()).optional().meta({
    rank: 1,
  }),
  dataProviderType: z.literal("Custom").meta({
    rank: 2,
  }),
});

const DataProviderBasicSchema = z.object({
  uri: z.url().meta({
    rank: 0,
  }),
  name: z.string().meta({
    rank: 1,
  }),
  description: z.string().meta({
    rank: 2,
  }),
  dataProviderType: z.enum(DATA_PROVIDER_TYPES).meta({
    rank: 3,
  }),
  version: z.string().meta({
    rank: 4,
  }),
  providerUrl: z.url().meta({
    rank: 5,
  }),
  logo: z.url().meta({
    rank: 6,
  }),
  categories: z.array(z.string()).meta({
    rank: 7,
  }),
});

export const DataProviderSchema = z.object({
  get basic() {
    return DataProviderBasicSchema.meta({
      ...DataProviderBasicSchema.meta(),
      rank: 0,
    });
  },
  supportedFormats: z.array(z.enum(DATA_PROVIDER_FORMATS)).meta({
    rank: 1,
  }),
  get personas() {
    return z
      .array(DataProviderPersonasSchema)
      .meta({ ...DataProviderPersonasSchema.meta(), rank: 2 });
  },
  get productLifeCycles() {
    return z
      .array(DataProviderLifeCycleSchema)
      .meta({ ...DataProviderLifeCycleSchema.meta(), rank: 3 });
  },
  get productStatus() {
    return z
      .array(DataProviderProductStatusSchema)
      .meta({ ...DataProviderProductStatusSchema.meta(), rank: 4 });
  },
  get authentication() {
    return z
      .discriminatedUnion("dataProviderType", [
        DataProviderAuthenticationDatabaseSchema.meta({
          ...DataProviderAuthenticationDatabaseSchema.meta(),
          rank: 0,
        }),
        DataProviderAuthenticationApiSchema.meta({
          ...DataProviderAuthenticationApiSchema.meta(),
          rank: 1,
        }),
        DataProviderAuthenticationFileSchema.meta({
          ...DataProviderAuthenticationFileSchema.meta(),
          rank: 2,
        }),
        DataProviderAuthenticationStreamSchema.meta({
          ...DataProviderAuthenticationStreamSchema.meta(),
          rank: 3,
        }),
        DataProviderAuthenticationDataWarehouseSchema.meta({
          ...DataProviderAuthenticationDataWarehouseSchema.meta(),
          rank: 4,
        }),
        DataProviderAuthenticationWebPortalSchema.meta({
          ...DataProviderAuthenticationWebPortalSchema.meta(),
          rank: 5,
        }),
        DataProviderAuthenticationMessagingQueueSchema.meta({
          ...DataProviderAuthenticationMessagingQueueSchema.meta(),
          rank: 6,
        }),
        DataProviderAuthenticationEmailServiceSchema.meta({
          ...DataProviderAuthenticationEmailServiceSchema.meta(),
          rank: 7,
        }),
        DataProviderAuthenticationCustomSchema.meta({
          ...DataProviderAuthenticationCustomSchema.meta(),
          rank: 8,
        }),
      ])
      .meta({
        rank: 5,
      });
  },
  get connection() {
    return z
      .discriminatedUnion("dataProviderType", [
        DataProviderConnectionDatabaseSchema.meta({
          ...DataProviderConnectionDatabaseSchema.meta(),
          rank: 0,
        }),
        DataProviderConnectionApiSchema.meta({
          ...DataProviderConnectionApiSchema.meta(),
          rank: 1,
        }),
        DataProviderConnectionFileSchema.meta({
          ...DataProviderConnectionFileSchema.meta(),
          rank: 2,
        }),
        DataProviderConnectionStreamSchema.meta({
          ...DataProviderConnectionStreamSchema.meta(),
          rank: 3,
        }),
        DataProviderConnectionDataWarehouseSchema.meta({
          ...DataProviderConnectionDataWarehouseSchema.meta(),
          rank: 4,
        }),
        DataProviderConnectionWebPortalSchema.meta({
          ...DataProviderConnectionWebPortalSchema.meta(),
          rank: 5,
        }),
        DataProviderConnectionMessagingQueueSchema.meta({
          ...DataProviderConnectionMessagingQueueSchema.meta(),
          rank: 6,
        }),
        DataProviderConnectionEmailServiceSchema.meta({
          ...DataProviderConnectionEmailServiceSchema.meta(),
          rank: 7,
        }),
        DataProviderConnectionCustomSchema.meta({
          ...DataProviderConnectionCustomSchema.meta(),
          rank: 8,
        }),
      ])
      .meta({ rank: 6 });
  },
});
