import React, { useCallback, useMemo } from "react";
import { Flex } from "design-system";
import type { ListItemProps } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import keyBy from "lodash/keyBy";
import { useLocation } from "react-router";

import type { ActionOperation } from "components/editorComponents/GlobalSearch/utils";
import { EntityIcon, getPluginIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import type { AppState } from "@appsmith/reducers";
import history from "utils/history";
import { ADD_PATH } from "constants/routes";
import { EDITOR_PANE_TEXTS } from "@appsmith/constants/messages";
import SegmentAddHeader from "../components/SegmentAddHeader";
import GroupedList from "../components/GroupedList";
import { useGroupedAddQueryOperations } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";

const AddQuery = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const pageId = useSelector(getCurrentPageId) as string;
  const plugins = useSelector((state: AppState) => {
    return state.entities.plugins.list;
  });
  const pluginGroups = useMemo(() => keyBy(plugins, "id"), [plugins]);

  const groupedActionOperations = useGroupedAddQueryOperations();

  const onCreateItemClick = useCallback(
    (item: ActionOperation) => {
      if (item.action) {
        dispatch(item.action(pageId, "ENTITY_EXPLORER"));
      } else if (item.redirect) {
        item.redirect(pageId, "ENTITY_EXPLORER");
      }
    },
    [pageId, dispatch],
  );

  const getListItems = (data: any[]) => {
    return data.map((fileOperation) => {
      const icon =
        fileOperation.icon ||
        (fileOperation.pluginId && (
          <EntityIcon>
            {getPluginIcon(pluginGroups[fileOperation.pluginId])}
          </EntityIcon>
        ));
      return {
        startIcon: icon,
        title:
          fileOperation.entityExplorerTitle ||
          fileOperation.dsName ||
          fileOperation.title,
        description: "",
        descriptionType: "inline",
        onClick: onCreateItemClick.bind(null, fileOperation),
      } as ListItemProps;
    });
  };

  const closeButtonClickHandler = useCallback(() => {
    history.push(location.pathname.replace(`${ADD_PATH}`, ""));
  }, [pageId]);

  return (
    <Flex flexDirection="column" gap={"spaces-4"}>
      <SegmentAddHeader
        onCloseClick={closeButtonClickHandler}
        titleMessage={EDITOR_PANE_TEXTS.query_create_tab_title}
      />
      <GroupedList
        groups={groupedActionOperations.map((group) => ({
          groupTitle: group.title,
          className: group.className,
          items: getListItems(group.operations),
        }))}
      />
    </Flex>
  );
};

export default AddQuery;
