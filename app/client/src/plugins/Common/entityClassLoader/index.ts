import type { DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import type { EntityParser } from "plugins/Common/entityParser";
import type { EntityDiffGenerator } from "plugins/Common/entityDiffGenerator";

/**
 * This interface is used to load the parser and diff generator for an entity at the time
 * of entity instantiation. This is useful when we want to load different parsers and diff
 * generators for different entities and also based on the action performed (linting/evaluation).
 */
export interface EntityClassLoader {
  load(entity: DataTreeEntity): {
    Parser: { new (): EntityParser };
    DiffGenerator: { new (): EntityDiffGenerator };
  };
}
