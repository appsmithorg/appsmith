export interface FunctionCallingEntityTypeOption {
  value: string;
  label: string;
  optionGroupType?: string;
  iconSrc?: string;
  parentId?: string;
  icon?: string | React.ReactNode;
}

export type FunctionCallingEntityType = "Query" | "JSFunction";

export interface FunctionCallingConfigFormToolField {
  id: string;
  description: string;
  entityId: string;
  isApprovalRequired: boolean;
  entityType: FunctionCallingEntityType;
}

export interface JSCollectionOption {
  id: string;
  name: string;
  functions: FunctionCallingEntityTypeOption[];
  icon?: string | React.ReactNode;
}
