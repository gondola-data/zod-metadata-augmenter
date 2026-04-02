export const DATA_PROVIDER_CREDENTIAL_VAULT_TYPE: string[] = [
  "Azure Key Vault",
  "AWS Key Management Services",
  "GCP Cloud Key Management",
];

export type DATA_PROVIDER_CREDENTIAL = {
  id: string;
  dataProviderId: string;
  name: string;
  vault: typeof DATA_PROVIDER_CREDENTIAL_VAULT_TYPE;
  secretObject: JSON;
};
