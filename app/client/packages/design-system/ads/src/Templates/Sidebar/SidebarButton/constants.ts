import { Condition } from "../enums";

export const ConditionConfig: Record<
  Condition,
  { icon: string; color: string }
> = {
  [Condition.Warn]: {
    icon: "warning",
    color: "#ffe283",
  },
  // TODO add this information for further conditions
  // Error: { color: "", icon: "" },
  // Success: { color: "", icon: "" },
};
