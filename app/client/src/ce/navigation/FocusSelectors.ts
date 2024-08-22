import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { matchPath } from "react-router";

import { getBaseUrlsForIDEType, getIDETypeByUrl } from "../entities/IDE/utils";

export const getSelectedDatasourceId = (path: string): string | undefined => {
  const entityInfo = identifyEntityFromPath(path);
  if (entityInfo.entity === FocusEntity.DATASOURCE) {
    return entityInfo.id;
  }
};

export const getSelectedEntityUrl = (path: string): string | undefined => {
  const ideType = getIDETypeByUrl(path);
  const basePaths = getBaseUrlsForIDEType(ideType);
  const entityPaths = basePaths.map((p) => `${p}/:entity*`);
  const match = matchPath<{ entity: string }>(path, entityPaths);
  if (match) {
    return match.params.entity;
  }
};
