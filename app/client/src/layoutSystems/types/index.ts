// Layout system types that Appsmith provides
export enum LayoutSystemTypes {
  FIXED = "FIXED",
  AUTO = "AUTO",
  ANVIL = "ANVIL",
}

// interface for appPositioning(aka layoutStystem) details.
// It is part of applicationDetails Record of an Application
// Refer to ApplicationPayload
export interface LayoutSystemTypeConfig {
  type: LayoutSystemTypes;
}
