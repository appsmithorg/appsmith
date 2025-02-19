export interface FunctionCallingEntityTypeOption {
  value: string;
  label: string;
  optionGroupType?: string;
  iconSrc?: string;
}

export type FunctionCallingEntityType =
  | "Query"
  | "JSFunction"
  | "SystemFunction";

export interface FunctionCallingConfigFormToolField {
  id: string;
  description: string;
  entityId: string;
  requiresApproval: boolean;
  entityType: FunctionCallingEntityType;
}
