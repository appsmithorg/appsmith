import {
  type EvaluationSubstitutionType,
  type OverrideDependency,
} from "../common";

export interface WidgetConfig {
  dependencyMap?: Record<string, string[]>;
  dynamicBindingPathList?: {
    key: string;
    value?: string;
  }[];
  dynamicTriggerPathList?: {
    key: string;
    value?: string;
  }[];
  propertyOverrideDependency: Record<string, Partial<OverrideDependency>>;
}

export interface ActionConfig {
  name: string;
  dependencyMap?: Record<string, string[]>;
  dynamicBindingPathList?: {
    key: string;
    value?: string;
  }[];
}

export interface JSConfig {
  name: string;
  dependencyMap?: Record<string, string[]>;
  reactivePaths: Record<string, EvaluationSubstitutionType>;
}

export type EntityConfig = WidgetConfig | ActionConfig | JSConfig;
