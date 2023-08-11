import type { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import { isJSAction } from "@appsmith/workers/Evaluation/evaluationUtils";
import { DefaultEntityParser } from "plugins/Common/entityParser";
import { JSLintDiffGenerator } from "plugins/Common/entityDiffGenerator/JSLintDiffGenerator";
import type { EntityClassLoader } from ".";
import { JSLintEntityParser } from "../entityParser/JSLintEntityParser";
import { DefaultDiffGenerator } from "../entityDiffGenerator";

export class LintEntityClassLoader implements EntityClassLoader {
  load(entity: DataTreeEntity) {
    if (isJSAction(entity)) {
      return {
        Parser: JSLintEntityParser,
        DiffGenerator: JSLintDiffGenerator,
      };
    }
    return {
      Parser: DefaultEntityParser,
      DiffGenerator: DefaultDiffGenerator,
    };
  }
}
