import { ActionableError, SourceEntity } from "entities/Events";

export enum EvalError {
  CYCLIC = "eval:cyclic",
}

export interface CyclicDependencyError extends ActionableError {
  type: EvalError.CYCLIC;
  entities: SourceEntity[];
}
