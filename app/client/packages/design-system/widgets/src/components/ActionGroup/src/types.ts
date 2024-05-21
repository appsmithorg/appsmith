import type { ButtonGroupProps } from "../../ButtonGroup";

export const ACTION_GROUP_ALIGNMENTS = {
  start: "Start",
  end: "End",
} as const;

export interface ActionGroupProps<T> extends ButtonGroupProps<T> {
  alignment?: keyof typeof ACTION_GROUP_ALIGNMENTS;
}
