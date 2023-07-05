import { GracefulWorkerService } from "utils/WorkerUtil";
import type {
  LintTreeRequestPayload,
  updateJSLibraryProps,
} from "plugins/Linting/types";
import { LINT_WORKER_ACTIONS as LINT_ACTIONS } from "plugins/Linting/types";
import { handlerMap } from "plugins/Linting/handlers";

export interface ILinter {
  lintTree(args: LintTreeRequestPayload): any;
  updateJSLibraryGlobals(args: updateJSLibraryProps): any;
  start(): void;
  shutdown(): void;
}

export class BaseLinter implements ILinter {
  lintTree(args: LintTreeRequestPayload) {
    return handlerMap[LINT_ACTIONS.LINT_TREE](args);
  }
  updateJSLibraryGlobals(args: updateJSLibraryProps) {
    return handlerMap[LINT_ACTIONS.UPDATE_LINT_GLOBALS](args);
  }
  start() {
    return;
  }
  shutdown() {
    return;
  }
}

export class WorkerLinter implements ILinter {
  server: GracefulWorkerService;
  constructor() {
    this.server = new GracefulWorkerService(
      new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
        // Note: the `Worker` part of the name is slightly important – LinkRelPreload_spec.js
        // relies on it to find workers in the list of all requests.
        name: "lintWorker",
      }),
    );
    this.start = this.start.bind(this);
    this.shutdown = this.shutdown.bind(this);
    this.lintTree = this.lintTree.bind(this);
    this.updateJSLibraryGlobals = this.updateJSLibraryGlobals.bind(this);
  }
  *start() {
    yield* this.server.start();
  }
  *shutdown() {
    yield* this.server.shutdown();
  }
  *lintTree(args: LintTreeRequestPayload) {
    return yield* this.server.request(LINT_ACTIONS.LINT_TREE, args);
  }
  *updateJSLibraryGlobals(args: updateJSLibraryProps) {
    return yield* this.server.request(LINT_ACTIONS.UPDATE_LINT_GLOBALS, args);
  }
}
