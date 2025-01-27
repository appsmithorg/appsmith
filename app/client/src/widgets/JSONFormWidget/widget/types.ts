import { Schema, SchemaItem, FieldState, JSON } from "../constants";
import { FieldThemeStylesheet } from "../component";

export type PathList = Array<{ key: string }>;

export interface FieldStateItem {
  isRequired?: boolean;
  isVisible?: boolean;
  isDisabled?: boolean;
  isValid?: boolean;
  filterText?: string;
}

export type MetaFieldState = FieldState<FieldStateItem>;

export interface ComputedSchema {
  status: string;
  schema: Schema;
  dynamicPropertyPathList?: PathList;
  modifiedSchemaItems: Record<string, SchemaItem>;
  removedSchemaItems: string[];
}

export interface ComputeSchemaProps {
  currSourceData?: JSON;
  prevSourceData?: JSON;
  prevSchema?: Schema;
  widgetName: string;
  maxAllowedFields?: number;
  currentDynamicPropertyPathList?: PathList;
  fieldThemeStylesheets: FieldThemeStylesheet;
  prevDynamicPropertyPathList?: PathList;
}

export enum ComputedSchemaStatus {
  LIMIT_EXCEEDED = "LIMIT_EXCEEDED",
  UNCHANGED = "UNCHANGED",
  UPDATED = "UPDATED",
}
