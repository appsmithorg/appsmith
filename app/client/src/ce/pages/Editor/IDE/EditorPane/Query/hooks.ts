import { useCallback } from "react";
import history from "utils/history";
import { LIST_PATH } from "@appsmith/constants/routes/appRoutes";
import { useLocation } from "react-router";
import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import { useCurrentEditorState } from "pages/Editor/IDE/hooks";
import { EditorEntityTabState } from "@appsmith/entities/IDE/constants";
import {
  apiEditorIdURL,
  queryAddURL,
  queryEditorIdURL,
} from "@appsmith/RouteBuilder";
import { useSelector } from "react-redux";
import { useFilteredFileOperations } from "components/editorComponents/GlobalSearch/GlobalSearchHooks";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getPagePermissions } from "selectors/editorSelectors";
import { getHasCreateActionPermission } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";
import { SEARCH_ITEM_TYPES } from "components/editorComponents/GlobalSearch/utils";
import { createMessage, EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";

export const useQueryAdd = () => {
  const location = useLocation();
  const currentEntityInfo = identifyEntityFromPath(location.pathname);
  const { segmentMode } = useCurrentEditorState();

  const addButtonClickHandler = useCallback(() => {
    let url = queryAddURL({});
    if (segmentMode === EditorEntityTabState.Edit) {
      switch (currentEntityInfo.entity) {
        case FocusEntity.QUERY:
          url = queryEditorIdURL({ queryId: currentEntityInfo.id, add: true });
          break;
        case FocusEntity.API:
          url = apiEditorIdURL({ apiId: currentEntityInfo.id, add: true });
          break;
      }
    }
    history.push(url);
  }, [currentEntityInfo.id, location, segmentMode]);

  return addButtonClickHandler;
};

export const useQueryList = () => {
  const listButtonClickHandler = useCallback(() => {
    history.push(`${location.pathname}${LIST_PATH}`);
  }, []);
  return listButtonClickHandler;
};

export type GroupedAddOperations = Array<{
  title?: string;
  className: string;
  operations: ActionOperation[];
}>;

export const useGroupedAddQueryOperations = (): GroupedAddOperations => {
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const pagePermissions = useSelector(getPagePermissions);

  const canCreateActions = getHasCreateActionPermission(
    isFeatureEnabled,
    pagePermissions,
  );
  const fileOperations = useFilteredFileOperations({ canCreateActions });
  const fromExistingSources = fileOperations.filter(
    (fileOperation) =>
      (fileOperation.focusEntityType === FocusEntity.QUERY ||
        fileOperation.focusEntityType === FocusEntity.DATASOURCE) &&
      fileOperation.kind !== SEARCH_ITEM_TYPES.sectionTitle,
  );
  const fromNewBlankAPI = fileOperations.filter(
    (fileOperation) => fileOperation.focusEntityType === FocusEntity.API,
  );

  const groups: GroupedAddOperations = [];

  /** From existing Datasource **/

  groups.push({
    title: createMessage(EDITOR_PANE_TEXTS.queries_create_from_existing),
    className: "t--from-source-list",
    operations: fromExistingSources,
  });

  /** From blanks **/

  groups.push({
    title: createMessage(EDITOR_PANE_TEXTS.queries_create_new),
    className: "t--new-blank-api",
    operations: fromNewBlankAPI,
  });

  return groups;
};
