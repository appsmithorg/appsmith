import type { EditorState } from "@appsmith/entities/IDE/constants";

import type { Condition } from "./Condition";

export interface ISidebarButton {
  state: EditorState;
  icon: string;
  title?: string;
  urlSuffix: string;
  condition?: Condition;
  tooltip?: string;
}
