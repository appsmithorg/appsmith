import { isTrueObject } from "@shared/ast/src/utils";
import type { WidgetEntityConfig } from "ee/entities/DataTree/types";
import type { DataTreeEntity } from "entities/DataTree/dataTreeTypes";
import type { Variable } from "entities/JSCollection";
import { isObject, uniqueId } from "lodash";
import type { Def } from "tern";
import { Types, getType } from "utils/TypeHelpers";
import { shouldAddSetter } from "workers/Evaluation/evaluate";
import { typeToTernType } from "workers/common/JSLibrary/ternDefinitionGenerator";

export type ExtraDef = Record<string, Def | string>;

export const flattenDef = (def: Def, entityName: string): Def => {
  const flattenedDef = def;
  if (!isTrueObject(def[entityName])) return flattenedDef;
  Object.entries(def[entityName]).forEach(([key, value]) => {
    if (key.startsWith("!")) return;
    const keyIsValid = isValidVariableName(key);
    const parentCompletion = !keyIsValid
      ? `${entityName}["${key}"]`
      : `${entityName}.${key}`;
    flattenedDef[parentCompletion] = value;
    if (!isTrueObject(value)) return;
    Object.entries(value).forEach(([subKey, subValue]) => {
      if (subKey.startsWith("!")) return;
      const childKeyIsValid = isValidVariableName(subKey);
      const childCompletion = !childKeyIsValid
        ? `${parentCompletion}["${subKey}"]`
        : `${parentCompletion}.${subKey}`;
      flattenedDef[childCompletion] = subValue;
    });
  });
  return flattenedDef;
};

export function generateTypeDef(
  value: unknown,
  extraDefsToDefine?: ExtraDef,
  depth = 0,
): Def | string {
  switch (getType(value)) {
    case Types.ARRAY: {
      const array = value as [unknown];
      if (depth > 5) {
        return `[?]`;
      }

      const arrayElementType = generateTypeDef(
        array[0],
        extraDefsToDefine,
        depth + 1,
      );

      if (isObject(arrayElementType)) {
        if (extraDefsToDefine) {
          const uniqueDefName = uniqueId("def_");
          extraDefsToDefine[uniqueDefName] = arrayElementType;
          return `[${uniqueDefName}]`;
        }
        return `[?]`;
      }
      return `[${arrayElementType}]`;
    }
    case Types.OBJECT: {
      const objType: Def = {};
      const object = value as Record<string, unknown>;
      Object.keys(object).forEach((k) => {
        objType[k] = generateTypeDef(object[k], extraDefsToDefine, depth);
      });
      return objType;
    }
    case Types.STRING:
      return "string";
    case Types.NUMBER:
      return "number";
    case Types.BOOLEAN:
      return "bool";
    case Types.NULL:
    case Types.UNDEFINED:
      return "?";
    default:
      return "?";
  }
}

const VALID_VARIABLE_NAME_REGEX = /^([a-zA-Z_$][a-zA-Z\d_$]*)$/;

export const isValidVariableName = (variableName: string) =>
  VALID_VARIABLE_NAME_REGEX.test(variableName);

export const getFunctionsArgsType = (args: Variable[]): string => {
  // skip same name args to avoiding creating invalid type
  const argNames = new Set<string>();
  // skip invalid args name
  args.forEach((arg) => {
    if (arg.name && isValidVariableName(arg.name)) argNames.add(arg.name);
  });
  const argNamesArray = [...argNames];
  const argsTypeString = argNamesArray.reduce(
    (accumulatedArgType, argName, currentIndex) => {
      switch (currentIndex) {
        case 0:
          return `${argName}: ?`;
        case 1:
          return `${accumulatedArgType}, ${argName}: ?`;
        default:
          return `${accumulatedArgType}, ${argName}: ?`;
      }
    },
    argNamesArray[0],
  );
  return argsTypeString ? `fn(${argsTypeString})` : `fn()`;
};

export function generateJSFunctionTypeDef(
  jsData: Record<string, unknown> = {},
  fullFunctionName: string,
  extraDefs: ExtraDef,
) {
  return {
    "!type": getFunctionsArgsType([]),
    data: generateTypeDef(jsData[fullFunctionName], extraDefs),
  };
}

export function addSettersToDefinitions(
  definitions: Def,
  entity: DataTreeEntity,
  entityConfig?: WidgetEntityConfig,
) {
  if (entityConfig && entityConfig.__setters) {
    const setters = Object.keys(entityConfig.__setters);

    setters.forEach((setterName: string) => {
      const setter = entityConfig.__setters?.[setterName];
      const setterType = typeToTernType(
        entityConfig.__setters?.[setterName].type,
      );

      if (shouldAddSetter(setter, entity)) {
        definitions[setterName] = `fn(value: ${setterType}) -> +Promise`;
      }
    });
  }
}
