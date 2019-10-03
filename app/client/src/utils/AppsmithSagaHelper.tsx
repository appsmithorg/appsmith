import {
  call as ReduxSagaCall,
  select as ReduxSagaSelect,
  put as ReduxSagaPut,
  takeLatest as ReduxSagaTakeLatest,
  takeEvery as ReduxSagaTakeEvery,
  all as ReduxSagaAll,
} from "redux-saga/effects";

function* safe(effect: any) {
  try {
    return yield effect;
  } catch (error) {
    console.log(error);
  }
}

export const call = (fn: any, ...args: unknown[]) =>
  safe(ReduxSagaCall(fn, ...args));
export const select = (state: any, ...args: any[]) =>
  safe(ReduxSagaSelect(state, ...args));
export const put = (action: any) => safe(ReduxSagaPut(action));
export const takeLatest = (pattern: any, worker: any) =>
  safe(ReduxSagaTakeLatest(pattern, worker));
export const takeEvery = (pattern: any, worker: any) =>
  safe(ReduxSagaTakeEvery(pattern, worker));
export const all = (args: unknown[]) => safe(ReduxSagaAll(args));
