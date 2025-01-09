import type { WidgetQueryGenerationFormConfig } from "../../WidgetQueryGenerators/types";

export interface OneClickBindingState {
  isConnecting: boolean;
  config: WidgetQueryGenerationFormConfig | null;
  showOptions: boolean;
}
