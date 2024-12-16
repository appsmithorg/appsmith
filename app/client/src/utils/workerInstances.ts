import { GracefulWorkerService } from "./WorkerUtil";

export const evalWorker = new GracefulWorkerService(
  new Worker(
    new URL("../workers/Evaluation/evaluation.worker.ts", import.meta.url),
    {
      type: "module",
      // Note: the `Worker` part of the name is slightly important – LinkRelPreload_spec.js
      // relies on it to find workers in the list of all requests.
      name: "evalWorker",
    },
  ),
);
