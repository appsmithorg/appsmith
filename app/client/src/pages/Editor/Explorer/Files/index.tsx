import React, { useCallback, useMemo } from "react";
import { useActiveAction } from "../hooks";
import { Entity } from "../Entity/index";
import {
  createMessage,
  ADD_QUERY_JS_TOOLTIP,
} from "@appsmith/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "selectors/editorSelectors";
import { ExplorerActionEntity } from "../Actions/ActionEntity";
import ExplorerJSCollectionEntity from "../JSActions/JSActionEntity";
import { toggleShowGlobalSearchModal } from "actions/globalSearchActions";
import { Colors } from "constants/Colors";
import {
  filterCategories,
  SEARCH_CATEGORY_ID,
} from "components/editorComponents/GlobalSearch/utils";
import EntityPlaceholder from "../Entity/Placeholder";
import { selectFilesForExplorer } from "selectors/entitiesSelector";

const emptyNode = (
  <EntityPlaceholder step={0}>
    Click the <strong>+</strong> icon above to create a new query, API or JS
    Object
  </EntityPlaceholder>
);

function Files() {
  const pageId = useSelector(getCurrentPageId) as string;
  const files = useSelector(selectFilesForExplorer);
  const dispatch = useDispatch();
  const onCreate = useCallback(() => {
    dispatch(
      toggleShowGlobalSearchModal(
        filterCategories[SEARCH_CATEGORY_ID.ACTION_OPERATION],
      ),
    );
  }, [dispatch]);

  const activeActionId = useActiveAction();

  const fileEntities = useMemo(
    () =>
      files.map(({ entity, type }: any) => {
        if (type === "group") {
          return (
            <div
              className={`text-sm text-[${Colors.CODE_GRAY}] pl-8 bg-trueGray-50 overflow-hidden overflow-ellipsis whitespace-nowrap`}
              key={entity.name}
            >
              {entity.name}
            </div>
          );
        } else if (type === "JS") {
          return (
            <ExplorerJSCollectionEntity
              id={entity.id}
              isActive={entity.id === activeActionId}
              key={entity.id}
              searchKeyword={""}
              step={2}
              type={type}
            />
          );
        } else {
          return (
            <ExplorerActionEntity
              id={entity.id}
              isActive={entity.id === activeActionId}
              key={entity.id}
              searchKeyword={""}
              step={2}
              type={type}
            />
          );
        }
      }),
    [files, activeActionId],
  );

  return (
    <Entity
      addButtonHelptext={createMessage(ADD_QUERY_JS_TOOLTIP)}
      alwaysShowRightIcon
      className={`group files`}
      disabled={false}
      entityId={pageId + "_widgets"}
      icon={null}
      isDefaultExpanded
      isSticky
      key={pageId + "_widgets"}
      name="QUERIES/JS"
      onCreate={onCreate}
      searchKeyword={""}
      step={0}
    >
      {fileEntities.length ? fileEntities : emptyNode}
    </Entity>
  );
}

Files.displayName = "Files";

export default React.memo(Files);
