import type { ILinter } from "./src/linters";
import { WorkerLinter, Linter } from "./src/linters";

export class LintingService {
  linter: ILinter;
  constructor(options: { useWorker: boolean }) {
    this.linter = options.useWorker ? new WorkerLinter() : new Linter();
    this.lintTree = this.lintTree.bind(this);
    this.updateJSLibraryGlobals = this.updateJSLibraryGlobals.bind(this);
  }
  *lintTree(data: any): any {
    return yield this.linter.lintTree(data);
  }
  *updateJSLibraryGlobals(data: any): any {
    return yield this.linter.updateJSLibraryGlobals(data);
  }
  *start() {
    yield this.linter.start();
  }
  *shutdown() {
    yield this.linter.shutdown();
  }
}
