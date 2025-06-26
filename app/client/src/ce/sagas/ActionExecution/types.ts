import type {
  TriggerKind,
  TriggerSource,
} from "constants/AppsmithActionConstants/ActionConstants";

export interface TriggerMeta {
  source?: TriggerSource;
  triggerPropertyName?: string;
  triggerKind?: TriggerKind;
  onPageLoad: boolean;
}
