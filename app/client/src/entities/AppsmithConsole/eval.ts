import { ActionableError, SourceEntity } from "entities/AppsmithConsole";

export enum EvalError {
  CYCLIC = "eval:cyclic",
}

export interface CyclicDependencyError extends ActionableError {
  type: EvalError.CYCLIC;
  entities: SourceEntity[];
}
