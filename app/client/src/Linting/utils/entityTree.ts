import type { TEntity, TEntityParser } from "Linting/lib/entity";
import { isJSEntity } from "Linting/lib/entity";
import EntityFactory from "Linting/lib/entity";
import type {
  ConfigTree,
  UnEvalTree,
  UnEvalTreeEntity,
} from "entities/DataTree/dataTreeFactory";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { mapValues, pick, uniq } from "lodash";
import { parseJSEntity } from "./parseJSEntity";
import { diff } from "deep-diff";
import { getEntityType } from "utils/DynamicBindingUtils";
import type { JSActionEntity } from "entities/DataTree/types";
import type { TParsedJSProperty } from "@shared/ast";

function defaultLintEntityParser(entity: TEntity) {
  return entity.getRawEntity();
}
function getEntityParser(entity: UnEvalTreeEntity): TEntityParser {
  switch (getEntityType(entity)) {
    case ENTITY_TYPE.JSACTION: {
      return parseJSEntity;
    }
    default: {
      return defaultLintEntityParser;
    }
  }
}

function diffGenerator(oldEntity?: TEntity, newEntity?: TEntity) {
  return diff(generateDiffObj(oldEntity), generateDiffObj(newEntity));
}

function generateDiffObj(entity?: TEntity) {
  if (!entity) {
    return {};
  }
  if (isJSEntity(entity)) {
    const entityForDiff: Record<string, string> = {};
    for (const [propertyName, propertyValue] of Object.entries(
      entity.getRawEntity(),
    )) {
      const parser = entity.entityParser as typeof parseJSEntity;
      const { parsedEntityConfig } = parser(entity);
      if (!parsedEntityConfig) continue;
      entityForDiff[propertyName] = getHashedConfigString(
        propertyValue,
        parsedEntityConfig[propertyName],
      );
    }
    return { [entity.getName()]: entityForDiff };
  }

  return { [entity.getName()]: entity.getRawEntity() };
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
      getEntityParser(unevalEntity),
      diffGenerator,
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
    const jsParser = entity.entityParser as typeof parseJSEntity;
    const { parsedEntity } = jsParser(entity);
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

function getHashedConfigString(
  propertyValue: string,
  config: TParsedJSProperty,
) {
  if (!config || !config.position || !config.value) return propertyValue;
  const { endColumn, endLine, startColumn, startLine } = config.position;

  return config.value + `${startColumn}${endColumn}${startLine}${endLine}`;
}

export type TEntityTree = ReturnType<typeof createEntityTree>;
