import type { ButtonGroupProps } from "../../ButtonGroup";

export interface ActionGroupProps<T> extends ButtonGroupProps<T> {
  alignment?: "start" | "center" | "end";
}
