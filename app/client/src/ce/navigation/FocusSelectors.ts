import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";

export const getSelectedDatasourceId = (path: string): string | undefined => {
  const entityInfo = identifyEntityFromPath(path);
  if (entityInfo.entity === FocusEntity.DATASOURCE) {
    return entityInfo.id;
  }
};
