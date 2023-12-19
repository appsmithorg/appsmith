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
} from "design-system";
import {
  createMessage,
  ERROR_ADD_API_INVALID_URL,
  NEW_API_BUTTON_TEXT,
  NEW_QUERY_BUTTON_TEXT,
} from "@appsmith/constants/messages";
import { createNewQueryAction } from "actions/apiPaneActions";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId, getPageList } from "selectors/editorSelectors";
import type { Datasource } from "entities/Datasource";
import type { EventLocation } from "@appsmith/utils/analyticsUtilTypes";
import { getCurrentEnvironmentId } from "@appsmith/selectors/environmentSelectors";

interface NewActionButtonProps {
  datasource?: Datasource;
  disabled?: boolean;
  packageName?: string;
  isLoading?: boolean;
  eventFrom?: string; // this is to track from where the new action is being generated
  pluginType?: string;
  style?: any;
  isNewQuerySecondaryButton?: boolean;
}
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

  const createQueryAction = useCallback(
    (pageId: string) => {
      if (
        pluginType === PluginType.API &&
        (!datasource ||
          !datasource.datasourceStorages[currentEnvironment]
            .datasourceConfiguration ||
          !datasource.datasourceStorages[currentEnvironment]
            .datasourceConfiguration.url)
      ) {
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
            ),
          );
        }
      }
    },
    [dispatch, currentPageId, datasource, pluginType],
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
          {pluginType === PluginType.DB || pluginType === PluginType.SAAS
            ? createMessage(NEW_QUERY_BUTTON_TEXT)
            : createMessage(NEW_API_BUTTON_TEXT)}
        </Button>
      </MenuTrigger>
      <MenuContent
        align={"end"}
        data-testId={"t--page-selection"}
        side={"bottom"}
      >
        <Text className="pl-2" kind="heading-xs">{`Create a ${
          pluginType === PluginType.DB || pluginType === PluginType.SAAS
            ? "query"
            : "api"
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
