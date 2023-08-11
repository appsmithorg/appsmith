import type { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import { isJSAction } from "@appsmith/workers/Evaluation/evaluationUtils";
import { DefaultEntityParser } from "plugins/utils/entityParser";
import { JSEvalEntityParser } from "../entityParser/JSEvalEntityParser";
import type { EntityClassLoader } from ".";
import { DefaultDiffGenerator } from "../entityDiffGenerator";

export class EvalEntityClassLoader implements EntityClassLoader {
  load(entity: DataTreeEntity) {
    if (isJSAction(entity)) {
      return {
        Parser: JSEvalEntityParser,
        DiffGenerator: DefaultDiffGenerator,
      };
    }
    return {
      Parser: DefaultEntityParser,
      DiffGenerator: DefaultDiffGenerator,
    };
  }
}
