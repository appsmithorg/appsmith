export interface FunctionCallingEntityTypeOption {
  value: string;
  label: string;
  optionGroupType?: string;
  iconSrc?: string;
}

export type FunctionCallingEntityType = "Query" | "JSFunction";

export interface FunctionCallingConfigFormToolField {
  id: string;
  description: string;
  entityId: string;
  isApprovalRequired: boolean;
  entityType: FunctionCallingEntityType;
}
