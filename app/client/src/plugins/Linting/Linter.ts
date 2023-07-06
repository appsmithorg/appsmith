import type { ILinter } from "./linters";
import { BaseLinter, WorkerLinter } from "./linters";
import type { LintTreeRequestPayload, updateJSLibraryProps } from "./types";

export class Linter {
  linter: ILinter;
  constructor(options: { useWorker: boolean }) {
    this.linter = options.useWorker ? new WorkerLinter() : new BaseLinter();
    this.lintTree = this.lintTree.bind(this);
    this.updateJSLibraryGlobals = this.updateJSLibraryGlobals.bind(this);
    this.start = this.start.bind(this);
    this.shutdown = this.shutdown.bind(this);
  }
  *lintTree(data: LintTreeRequestPayload) {
    return yield* this.linter.lintTree(data);
  }
  *updateJSLibraryGlobals(data: updateJSLibraryProps) {
    return yield* this.linter.updateJSLibraryGlobals(data);
  }
  *start() {
    yield this.linter.start();
  }
  *shutdown() {
    yield this.linter.shutdown();
  }
}
