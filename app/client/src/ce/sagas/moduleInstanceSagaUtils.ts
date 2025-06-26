/* eslint-disable @typescript-eslint/no-unused-vars */

import type { DataTreeEntityObject } from "ee/entities/DataTree/types";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeTypes";

export interface ParamsForJSModuleInstance {
  configTree: ConfigTree;
  dataTree: DataTree;
  entity: DataTreeEntityObject;
  entityName: string;
  propertyPath: string;
}

export function* executionForJSModuleInstance({
  configTree,
  dataTree,
  entity,
  entityName,
  propertyPath,
}: ParamsForJSModuleInstance) {}
