import type { Condition } from "../enums";

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
