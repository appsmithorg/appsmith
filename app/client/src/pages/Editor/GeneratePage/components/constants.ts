import { DropdownOption } from "components/ads/Dropdown";
import { DatasourceTable } from "entities/Datasource";

export const PLUGIN_ID = {
  GOOGLE_SHEET: "6080f9266b8cfd602957ba72",
};

// Temporary hardcoded valid plugins which support generate template
// Record<pluginId, pluginName>
export const VALID_PLUGINS_FOR_TEMPLATE: Record<string, string> = {
  "5c9f512f96c1a50004819786": "PostgreSQL",
  "5e687c18fb01e64e6a3f873f": "MongoDB",
  "5f16c4be93f44d4622f487e2": "Mysql",
  "5f92f2628c11891d27ff0f1f": "MsSQL",
  "5ff5af0851d64d5127abc597": "Redshift",
  "6023b4a070eb652de19476d3": "S3",
  // [PLUGIN_ID.GOOGLE_SHEET]: "Google Sheets",
  "60cb22feef0bd0550e175f3d": "Snowflake",
  // "5ca385dc81b37f0004b4db85": "REST API",
  // "5e75ce2b8f4b473507a4a52e": "Rapid API Plugin",
  // "5f9008736e895f2d2942eb07": "ElasticSearch",
  // "5f90331f8373f73ad9b2fd2e": "DynamoDB",
  // "5f9169920c6d936f469f4c8a": "Redis",
  // "5fbbc39ad1f71d6666c32e4b": "Firestore",
};

export type DropdownOptions = Array<DropdownOption>;

export interface DatasourceTableDropdownOption extends DropdownOption {
  data: DatasourceTable;
}
