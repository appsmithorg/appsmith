import type { FeatureFlags } from "ee/entities/FeatureFlag";
import type { ILinter } from "./linters";
import { WorkerLinter } from "./linters";
import type { LintTreeRequestPayload, updateJSLibraryProps } from "./types";

export class Linter {
  linter: ILinter;
  constructor() {
    this.linter = new WorkerLinter();
    this.lintTree = this.lintTree.bind(this);
    this.updateJSLibraryGlobals = this.updateJSLibraryGlobals.bind(this);
    this.start = this.start.bind(this);
    this.shutdown = this.shutdown.bind(this);
    this.setup = this.setup.bind(this);
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
  *setup(featureFlags: FeatureFlags) {
    yield this.linter.setup(featureFlags);
  }
}
