export type HiddenType = boolean | Condition | ConditionObject;

export type ComparisonOperations =
  | "EQUALS"
  | "NOT_EQUALS"
  | "LESSER"
  | "GREATER"
  | "IN"
  | "NOT_IN"
  | "FEATURE_FLAG"
  | "VIEW_MODE"
  | "DEFINED_AND_NOT_EQUALS";

export interface Condition {
  path: string;
  comparison: ComparisonOperations;
  value: unknown;
  flagValue: string;
}

export interface ConditionObject {
  conditionType: string;
  conditions: Conditions;
}

export type Conditions = Array<Condition> | ConditionObject;
