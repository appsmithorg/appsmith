import { Condition } from "../../../enums";

export const ConditionConfig: Record<Condition, { icon: string; color: string }> = {
  [Condition.Warn]: {
    icon: "warning",
    color: "#ffe283",
  },
  // TODO add this information for further conditions
  // Error: { color: "", icon: "" },
  // Success: { color: "", icon: "" },
};

export interface SidebarButtonProps {
  title?: string;
  testId: string;
  selected: boolean;
  icon: string;
  onClick: (urlSuffix: string) => void;
  urlSuffix: string;
  tooltip?: string;
  condition?: Condition;
}
