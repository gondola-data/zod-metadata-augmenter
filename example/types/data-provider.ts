import type { DATA_PROVIDER_CONNECTION } from "./data-provider-connection";
import type { DATA_PROVIDER_CREDENTIAL } from "./data-provider-cred";
import type { DATA_PROVIDER_AUTHENTICATION } from "./data-provider-auth";

export type DATA_PROVIDER = {
  id: string;
  name: string;
  type: DATA_PROVIDER_TYPE;
  description?: string;
  version?: string;
  url?: string;
  logo?: string;
  categories?: string[];
  supportedFormats?: DATA_PROVIDER_FORMAT[];
  personas?: DATA_PROVIDER_PERSONA[];
  productLifecycles?: DATA_PROVIDER_PRODUCT_LIFE_CYCLE[];
  productStatuses?: DATA_PROVIDER_PRODUCT_STATUS[];
  authentication?: DATA_PROVIDER_AUTHENTICATION;
  connection?: DATA_PROVIDER_CONNECTION;
  credential?: DATA_PROVIDER_CREDENTIAL;
};

export const DATA_PROVIDER_TYPES: string[] = [
  "Database",
  "API",
  "File/ Blob",
  "Stream",
  "Web Portal",
  "Data Warehouse",
  "Messaging Queue",
  "Email Service",
  "Custom",
];

export type DATA_PROVIDER_TYPE = (typeof DATA_PROVIDER_TYPES)[number];

export const DATA_PROVIDER_FORMATS: string[] = [
  "csv",
  "json",
  "xml",
  "parquet",
  "avro",
  "excel",
  "pdf",
  "delta",
  "iceberg",
];

export type DATA_PROVIDER_FORMAT = (typeof DATA_PROVIDER_FORMATS)[number];

export type DATA_PROVIDER_PERSONA = {
  name: string;
  function: string;
  email: string;
};

export const DATA_PROVIDER_PRODUCT_LIFE_CYCLES: string[] = [
  "Concept",
  "Development",
  "Launched",
  "End-of-Life",
];

export type DATA_PROVIDER_PRODUCT_LIFE_CYCLE = {
  status: (typeof DATA_PROVIDER_PRODUCT_LIFE_CYCLES)[number];
  effectiveDate: Date;
  notes?: string;
};

export const DATA_PROVIDER_PRODUCT_STATUS: string[] = [
  "Active",
  "Draft",
  "Archived",
  "Development Freeze",
  "Decomissioned",
];

export type DATA_PROVIDER_PRODUCT_STATUS = {
  status: (typeof DATA_PROVIDER_PRODUCT_STATUS)[number];
  effectiveDate: Date;
};
