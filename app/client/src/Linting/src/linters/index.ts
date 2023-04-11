import { GracefulWorkerService } from "utils/WorkerUtil";
import { LINT_WORKER_ACTIONS as LINT_ACTIONS } from "Linting/utils/types";
import { handlerMap } from "Linting/src/handlers";

export interface ILinter {
  lintTree(...args: any): any;
  updateJSLibraryGlobals(...args: any): any;
  start(): any;
  shutdown(): any;
}

export class Linter implements ILinter {
  lintTree(args: any): any {
    return handlerMap[LINT_ACTIONS.LINT_TREE](args);
  }
  updateJSLibraryGlobals(args: any): any {
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
        name: "linter",
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
  *lintTree(args: any): any {
    return yield* this.server.request(LINT_ACTIONS.LINT_TREE, args);
  }
  *updateJSLibraryGlobals(...args: any): any {
    return yield* this.server.request(
      LINT_ACTIONS.UPDATE_LINT_GLOBALS,
      ...args,
    );
  }
}
