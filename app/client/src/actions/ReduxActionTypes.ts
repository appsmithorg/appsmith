import type { ERROR_CODES } from "ee/constants/ApiConstants";
import type {
  ReduxActionErrorType,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";

export type ReduxActionType =
  (typeof ReduxActionTypes)[keyof typeof ReduxActionTypes];

export interface ReduxAction<T> {
  type: ReduxActionType | ReduxActionErrorType;
  payload: T;
}

export type ReduxActionWithoutPayload = Pick<ReduxAction<undefined>, "type">;

export interface ReduxActionWithMeta<T, M> extends ReduxAction<T> {
  meta: M;
}

export interface ReduxActionWithCallbacks<T, S, E> extends ReduxAction<T> {
  onSuccess?: ReduxAction<S>;
  onError?: ReduxAction<E>;
  onSuccessCallback?: (response: S) => void;
  onErrorCallback?: (error: E) => void;
}

export type AnyReduxAction = ReduxAction<unknown> | ReduxActionWithoutPayload;

export interface PromisePayload {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reject: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: any;
}

export interface ReduxActionWithPromise<T> extends ReduxAction<T> {
  payload: T & PromisePayload;
}

export interface ReduxActionErrorPayload {
  message: string;
  source?: string;
  code?: ERROR_CODES;
  stackTrace?: string;
}
