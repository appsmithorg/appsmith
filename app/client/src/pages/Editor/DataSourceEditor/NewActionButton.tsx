import React, { useCallback, useState } from "react";
import { PluginType } from "entities/Action";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  toast,
  Text,
  MenuSeparator,
  Tag,
} from "@appsmith/ads";
import {
  createMessage,
  ERROR_ADD_API_INVALID_URL,
  NEW_AI_BUTTON_TEXT,
  NEW_API_BUTTON_TEXT,
  NEW_QUERY_BUTTON_TEXT,
} from "ee/constants/messages";
import { createNewQueryAction } from "actions/pluginActionActions";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId, getPageList } from "selectors/editorSelectors";
import type { Datasource } from "entities/Datasource";
import type { EventLocation } from "ee/utils/analyticsUtilTypes";
import { getCurrentEnvironmentId } from "ee/selectors/environmentSelectors";
import { getSelectedTableName } from "ee/selectors/entitiesSelector";

interface NewActionButtonProps {
  datasource?: Datasource;
  disabled?: boolean;
  packageName?: string;
  isLoading?: boolean;
  eventFrom?: string; // this is to track from where the new action is being generated
  pluginType?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: any;
  isNewQuerySecondaryButton?: boolean;
}

export const apiPluginHasUrl = (
  currentEnvironment: string,
  pluginType?: string,
  datasource?: Datasource,
) => {
  if (pluginType !== PluginType.API) {
    return false;
  }

  return (
    !datasource ||
    !datasource?.datasourceStorages[currentEnvironment]?.datasourceConfiguration
      ?.url
  );
};

function NewActionButton(props: NewActionButtonProps) {
  const {
    datasource,
    disabled,
    isLoading,
    isNewQuerySecondaryButton,
    pluginType,
  } = props;
  const [isSelected, setIsSelected] = useState(false);
  const [isPageSelectionOpen, setIsPageSelectionOpen] = useState(false);

  const dispatch = useDispatch();
  const currentPageId = useSelector(getCurrentPageId);
  const pages = useSelector(getPageList);
  const currentEnvironment = useSelector(getCurrentEnvironmentId);
  const pageMenuItems = [
    pages.find((p) => p.pageId === currentPageId),
    ...pages.filter((p) => p.pageId !== currentPageId),
  ];
  const queryDefaultTableName = useSelector(getSelectedTableName);

  const createQueryAction = useCallback(
    (pageId: string) => {
      if (apiPluginHasUrl(currentEnvironment, pluginType, datasource)) {
        toast.show(ERROR_ADD_API_INVALID_URL(), {
          kind: "error",
        });

        return;
      }

      if (currentPageId) {
        setIsSelected(true);

        if (datasource) {
          dispatch(
            createNewQueryAction(
              pageId,
              props.eventFrom as EventLocation,
              datasource?.id,
              queryDefaultTableName,
            ),
          );
        }
      }
    },
    [dispatch, currentPageId, datasource, pluginType, queryDefaultTableName],
  );

  const handleOnInteraction = useCallback(
    (open: boolean) => {
      if (disabled || isLoading) return;

      if (!open) {
        setIsPageSelectionOpen(false);

        return;
      }

      if (pages.length === 1) {
        createQueryAction(currentPageId);

        return;
      }

      setIsPageSelectionOpen(true);
    },
    [pages, createQueryAction, disabled, isLoading],
  );

  const getCreateButtonText = () => {
    switch (pluginType) {
      case PluginType.DB:
      case PluginType.SAAS:
        return createMessage(NEW_QUERY_BUTTON_TEXT);
      case PluginType.AI:
        return createMessage(NEW_AI_BUTTON_TEXT);
      default:
        return createMessage(NEW_API_BUTTON_TEXT);
    }
  };

  return (
    <Menu onOpenChange={handleOnInteraction} open={isPageSelectionOpen}>
      <MenuTrigger disabled={disabled}>
        <Button
          className="t--create-query"
          id={"create-query"}
          isDisabled={!!disabled}
          isLoading={isSelected || isLoading}
          kind={isNewQuerySecondaryButton ? "secondary" : "primary"}
          onClick={() => handleOnInteraction(true)}
          size="md"
          startIcon="plus"
        >
          {getCreateButtonText()}
        </Button>
      </MenuTrigger>
      <MenuContent
        align={"end"}
        data-testId={"t--page-selection"}
        height={pages.length <= 4 ? "fit-content" : "186px"}
        side={"bottom"}
      >
        <Text className="pl-2" kind="heading-xs">{`Create ${
          pluginType === PluginType.DB || pluginType === PluginType.SAAS
            ? "query"
            : "API"
        } in`}</Text>
        {pageMenuItems.map((page, i) => {
          if (page) {
            return [
              <MenuItem
                key={page.pageId}
                onSelect={() => createQueryAction(page.pageId)}
                startIcon={page.isDefault ? "home-3-line" : "page-line"}
                title={page.pageName}
              >
                <div className={"flex justify-between gap-2 flex-1"}>
                  <Text
                    className={
                      "text-ellipsis whitespace-nowrap overflow-hidden"
                    }
                    kind={"action-m"}
                  >
                    {page.pageName}
                  </Text>
                  {i === 0 ? <Tag isClosable={false}>Current</Tag> : null}
                </div>
              </MenuItem>,
              i === 0 ? <MenuSeparator /> : null,
            ];
          }

          return null;
        })}
      </MenuContent>
    </Menu>
  );
}

export default NewActionButton;
