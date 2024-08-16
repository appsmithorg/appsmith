import { GracefulWorkerService } from "utils/WorkerUtil";
import type {
  LintTreeRequestPayload,
  updateJSLibraryProps,
} from "plugins/Linting/types";
import { LINT_WORKER_ACTIONS as LINT_ACTIONS } from "plugins/Linting/types";
import type { FeatureFlags } from "ee/entities/FeatureFlag";

export interface ILinter {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lintTree(args: LintTreeRequestPayload): any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateJSLibraryGlobals(args: updateJSLibraryProps): any;
  start(): void;
  shutdown(): void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup(args: FeatureFlags): any;
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
    this.setup = this.setup.bind(this);
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
  *setup(args: FeatureFlags) {
    return yield* this.server.request(LINT_ACTIONS.SETUP, args);
  }
}
