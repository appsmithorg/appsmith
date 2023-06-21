import { isJSEntity } from "Linting/lib/entity";
import EntityFactory from "Linting/lib/entity";
import type {
  ConfigTree,
  UnEvalTree,
  UnEvalTreeEntity,
} from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { mapValues, pick, uniq } from "lodash";
import { getEntityType } from "utils/DynamicBindingUtils";
import type { JSActionEntity } from "entities/DataTree/types";
import { defaultEntityParser, jsLintEntityParser } from "./entityParser";
import { defaultDiffGenerator, jsLintDiffGenerator } from "./diffGenerator";

function getLintEntityParser(entity: UnEvalTreeEntity) {
  switch (getEntityType(entity)) {
    case ENTITY_TYPE.JSACTION: {
      return jsLintEntityParser;
    }
    default: {
      return defaultEntityParser;
    }
  }
}

function getLintDiffGenerator(entity: UnEvalTreeEntity) {
  switch (getEntityType(entity)) {
    case ENTITY_TYPE.JSACTION: {
      return jsLintDiffGenerator;
    }
    default: {
      return defaultDiffGenerator;
    }
  }
}

export function createEntityTree(
  unEvalTree: UnEvalTree,
  configTree: ConfigTree,
) {
  const tree: Record<string, ReturnType<typeof EntityFactory.getEntity>> = {};
  for (const entityName of Object.keys(unEvalTree)) {
    const unevalEntity = unEvalTree[entityName];
    const configTreeEntity = configTree[entityName];
    tree[entityName] = EntityFactory.getEntity(
      unevalEntity,
      configTreeEntity,
      getLintEntityParser(unevalEntity),
      getLintDiffGenerator(unevalEntity),
    );
  }
  return tree;
}

export function getUnevalEntityTree(entityTree: TEntityTree) {
  return mapValues(entityTree, (entity) => {
    return entity.getRawEntity();
  });
}

export function updateTreeWithParsedJS(entityTree: TEntityTree) {
  for (const entity of Object.values(entityTree)) {
    if (!isJSEntity(entity)) continue;
    const jsParser = entity.entityParser as typeof jsLintEntityParser;
    const { parsedEntity } = jsParser.parse(entity);
    if (!parsedEntity) continue;
    entity.entity = pick(entity.entity, [
      "body",
      "actionId",
      "ENTITY_TYPE",
    ]) as JSActionEntity;
    for (const [propertyName, propertyValue] of Object.entries(parsedEntity)) {
      entity.entity[propertyName] = propertyValue;
    }
  }
}

export function getEntityTreeDifferences(
  oldEntityTree: TEntityTree,
  newEntityTree: TEntityTree,
) {
  let differences: any = [];
  const allEntityNames = uniq(
    Object.keys(oldEntityTree).concat(Object.keys(newEntityTree)),
  );

  for (const entityName of allEntityNames) {
    const oldEntity = oldEntityTree[entityName];
    const newEntity = newEntityTree[entityName];

    if (newEntity) {
      const diff = newEntity.computeDifference(oldEntity);
      if (!diff) continue;
      differences = differences.concat(diff);
    } else {
      differences.push({
        kind: "D",
        path: [entityName],
        lhs: oldEntity,
      });
    }
  }

  return differences;
}

export type TEntityTree = ReturnType<typeof createEntityTree>;
