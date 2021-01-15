import { ActionableError, SourceEntity } from "entities/Errors";

export enum EvalError {
  CYCLIC = "eval:cyclic",
}

export interface CyclicDependencyError extends ActionableError {
  type: EvalError.CYCLIC;
  entities: SourceEntity[];
}
