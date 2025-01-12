import type { AnyReduxAction, ReduxAction } from "./ReduxActionTypes";

export interface AffectedJSObjects {
  ids: string[];
  isAllAffected: boolean;
}

export interface BufferedReduxAction<T> extends ReduxAction<T> {
  affectedJSObjects: AffectedJSObjects;
}

export interface EvaluationReduxAction<T> extends ReduxAction<T> {
  postEvalActions?: Array<AnyReduxAction>;
  affectedJSObjects?: AffectedJSObjects;
}
