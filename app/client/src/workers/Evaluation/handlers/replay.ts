import ReplayEditor from "entities/Replay/ReplayEntity/ReplayEditor";
import { EvalWorkerRequest } from "../types";
import { CANVAS, replayMap } from "./evalTree";

export function undo(request: EvalWorkerRequest) {
  const { requestData } = request;
  const { entityId } = requestData;
  if (!replayMap[entityId || CANVAS]) return;
  const replayResult = replayMap[entityId || CANVAS].replay("UNDO");
  replayMap[entityId || CANVAS].clearLogs();
  return replayResult;
}

export function redo(request: EvalWorkerRequest) {
  const { requestData } = request;
  const { entityId } = requestData;
  if (!replayMap[entityId ?? CANVAS]) return;
  const replayResult = replayMap[entityId ?? CANVAS].replay("REDO");
  replayMap[entityId ?? CANVAS].clearLogs();
  return replayResult;
}

export function updateReplayObject(request: EvalWorkerRequest) {
  const { requestData } = request;
  const { entity, entityId, entityType } = requestData;
  const replayObject = replayMap[entityId];
  if (replayObject) {
    replayObject.update(entity);
  } else {
    replayMap[entityId] = new ReplayEditor(entity, entityType);
  }
  return true;
}
