import type {
  UpdateWidgetMetaPropertyPayload,
  ResetWidgetMetaPayload,
  BatchUpdateWidgetMetaPropertyPayload,
} from "actions/metaActions";
import type { ReduxAction } from "ce/constants/ReduxActionConstants";
import type { EvalMetaUpdates } from "ce/workers/common/DataTreeEvaluator/types";
import type { WidgetEntityConfig } from "ce/entities/DataTree/types";

export type WidgetMetaState = Record<string, unknown>;
export type MetaState = Record<string, WidgetMetaState>;

export interface TableFilterPanePositionConfig {
  widgetId: string;
  isMoved: boolean;
  position: {
    left: number;
    top: number;
  };
}
