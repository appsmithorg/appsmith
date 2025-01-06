import React, { useCallback, useEffect, useMemo } from "react";
import { Button, Flex } from "@appsmith/ads";
import { useSelector } from "react-redux";

import { selectWidgetsForCurrentPage } from "ee/selectors/entitiesSelector";
import { getPagePermissions } from "selectors/editorSelectors";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getHasManagePagePermission } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import { EmptyState } from "@appsmith/ads";
import history from "utils/history";
import { builderURL } from "ee/RouteBuilder";
import styled from "styled-components";
import { WidgetEntityListTree } from "pages/Editor/Explorer/Widgets/WidgetEntityListTree";
import { WidgetEntityList } from "pages/Editor/Explorer/Widgets/WidgetEntityList";

const ListContainer = styled(Flex)`
  & .t--entity-item {
    height: 32px;
  }
`;

const ListWidgets = (props: {
  setFocusSearchInput: (focusSearchInput: boolean) => void;
}) => {
  const { setFocusSearchInput } = props;
  const widgets = useSelector(selectWidgetsForCurrentPage);
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canManagePages = getHasManagePagePermission(
    isFeatureEnabled,
    pagePermissions,
  );

  const addButtonClickHandler = useCallback(() => {
    setFocusSearchInput(true);
    history.push(builderURL({}));
  }, [setFocusSearchInput]);

  const widgetsExist =
    widgets && widgets.children && widgets.children.length > 0;

  useEffect(
    function resetFocusOnSearch() {
      setFocusSearchInput(false);
    },
    [setFocusSearchInput],
  );

  const blankStateButtonProps = useMemo(
    () => ({
      className: "t--add-item",
      testId: "t--add-item",
      text: createMessage(EDITOR_PANE_TEXTS.widget_add_button),
      onClick: canManagePages ? addButtonClickHandler : undefined,
    }),
    [addButtonClickHandler, canManagePages],
  );

  const isNewWidgetTreeEnabled = useFeatureFlag(
    FEATURE_FLAG.release_new_entity_item_enabled,
  );

  return (
    <ListContainer
      flexDirection="column"
      gap="spaces-3"
      overflow="hidden"
      py="spaces-3"
    >
      {!widgetsExist ? (
        /* If no widgets exist, show the blank state */
        <EmptyState
          button={blankStateButtonProps}
          description={createMessage(
            EDITOR_PANE_TEXTS.widget_blank_state_description,
          )}
          icon={"widgets-v3"}
        />
      ) : canManagePages ? (
        /* We show the List Add button when side by side is not enabled  */
        <Flex flexDirection="column" px="spaces-3">
          <Button
            className="t--add-item"
            data-testid="t--add-item"
            kind={"secondary"}
            onClick={addButtonClickHandler}
            size={"sm"}
            startIcon={"add-line"}
          >
            {createMessage(EDITOR_PANE_TEXTS.widget_add_button)}
          </Button>
        </Flex>
      ) : null}
      {widgetsExist ? (
        <Flex
          data-testid="t--ide-list"
          flex="1"
          flexDirection={"column"}
          overflowY="auto"
          px="spaces-3"
        >
          {isNewWidgetTreeEnabled ? (
            <WidgetEntityListTree />
          ) : (
            <WidgetEntityList />
          )}
        </Flex>
      ) : null}
    </ListContainer>
  );
};

export default ListWidgets;
