import { get } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import styled, { useTheme } from "styled-components";
import React, { useCallback, DragEvent, useState, useEffect } from "react";

import {
  updatePage,
  clonePageInit,
  deletePage,
  setPageAsDefault,
  setPageSlug,
} from "actions/pageActions";
import EditName from "./EditName";
import ContextMenu from "./ContextMenu";
import { FormIcons } from "icons/FormIcons";
import { ControlIcons } from "icons/ControlIcons";

import { Page } from "@appsmith/constants/ReduxActionConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Colors } from "constants/Colors";
import { MenuIcons } from "icons/MenuIcons";
import { TooltipComponent } from "design-system";
import {
  CLONE_TOOLTIP,
  createMessage,
  DEFAULT_PAGE_TOOLTIP,
  DELETE_TOOLTIP,
  HIDDEN_TOOLTIP,
} from "@appsmith/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";

import {
  getCurrentApplicationId,
  selectApplicationVersion,
} from "selectors/editorSelectors";
import { ApplicationVersion } from "actions/applicationActions";
import { Button, Category, TextInput } from "components/ads";
import { AppState } from "reducers";

export const Container = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  cursor: grab;

  &:focus,
  &:active {
    cursor: grabbing;
  }
`;

export const ListItem = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  padding: 10px;
  background-color: ${Colors.GREY_1};
  .url {
    background-color: ${Colors.GREY_3};
    padding: 2px 4px;
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
`;

export const Action = styled.button`
  cursor: pointer;
  height: 28px;
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  border: none;
  background: transparent;
  margin-left: 4px;

  &:focus {
    outline: none;
  }
`;

const DefaultPageIcon = MenuIcons.DEFAULT_HOMEPAGE_ICON;
const DeleteIcon = FormIcons.DELETE_ICON;
const CopyIcon = ControlIcons.COPY_CONTROL;
const DragIcon = ControlIcons.DRAG_CONTROL;
const HideIcon = ControlIcons.HIDE_COLUMN;

export interface PageListItemProps {
  item: Page;
}

const disableDrag = {
  // Draggable true is required to invoke onDragStart
  draggable: true,
  onDragStart: (e: DragEvent<HTMLDivElement>) => {
    // Stop drag event propagation to prevent click events
    e.stopPropagation();
  },
};

function PageListItem(props: PageListItemProps) {
  const theme = useTheme();
  const { item } = props;
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  /**
   * clones the page
   *
   * @return void
   */
  const clonePageCallback = useCallback((): void => {
    dispatch(clonePageInit(item.pageId, true));
  }, [dispatch, item]);

  /**
   * delete the page
   *
   * @return void
   */
  const deletePageCallback = useCallback((): void => {
    dispatch(deletePage(item.pageId));

    AnalyticsUtil.logEvent("DELETE_PAGE", {
      pageName: item.pageName,
    });
  }, [dispatch, item]);

  /**
   * sets the page as default
   *
   * @return void
   */
  const setPageAsDefaultCallback = useCallback((): void => {
    dispatch(setPageAsDefault(item.pageId, applicationId));
  }, [dispatch, item, applicationId]);

  /**
   * sets the page hidden
   *
   * @return void
   */
  const setPageHidden = useCallback(() => {
    return dispatch(updatePage(item.pageId, item.pageName, !item.isHidden));
  }, [dispatch, item]);

  return (
    <Container>
      <ListItem>
        <DragIcon
          color={get(theme, "colors.pagesEditor.iconColor")}
          cursor="move"
          height={20}
          width={20}
        />
        <div className="flex flex-col items-start px-3 flex-1">
          <div className="flex flex-row justify-between w-full">
            <EditName page={item} />
            <Actions {...disableDrag}>
              {item.isDefault && (
                <TooltipComponent
                  content={createMessage(DEFAULT_PAGE_TOOLTIP)}
                  hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
                  position="bottom"
                >
                  <Action>
                    <DefaultPageIcon
                      color={Colors.GREEN}
                      height={16}
                      width={16}
                    />
                  </Action>
                </TooltipComponent>
              )}
              {item.isHidden && (
                <TooltipComponent
                  content={createMessage(HIDDEN_TOOLTIP)}
                  hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
                  position="bottom"
                >
                  <Action>
                    <HideIcon color={Colors.GREY_9} height={16} width={16} />
                  </Action>
                </TooltipComponent>
              )}
              <ContextMenu
                onCopy={clonePageCallback}
                onDelete={deletePageCallback}
                onSetPageDefault={setPageAsDefaultCallback}
                onSetPageHidden={setPageHidden}
                page={item}
              />
              <TooltipComponent
                content={createMessage(CLONE_TOOLTIP)}
                hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
                position="bottom"
              >
                <Action type="button">
                  <CopyIcon
                    color={Colors.GREY_9}
                    height={16}
                    onClick={clonePageCallback}
                    width={16}
                  />
                </Action>
              </TooltipComponent>
              <TooltipComponent
                content={createMessage(DELETE_TOOLTIP)}
                hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
                position="bottom"
              >
                <Action type="button">
                  <DeleteIcon
                    color={
                      item.isDefault
                        ? get(theme, "colors.propertyPane.deleteIconColor")
                        : Colors.GREY_9
                    }
                    disabled={item.isDefault}
                    height={16}
                    onClick={deletePageCallback}
                    width={16}
                  />
                </Action>
              </TooltipComponent>
            </Actions>
          </div>
          {/* <CustomURLSlug page={item} /> */}
        </div>
        {/* Disabling drag on action items as attempting to drag also invokes the click event.
         Clicks events in child elements could be disabled once we upgrade react-use-gesture to
         the latest version */}
      </ListItem>
    </Container>
  );
}

type CustomURLSlugProp = {
  page: Page;
};

const isPageLoading = (pageId: string) => (state: AppState) =>
  state.entities.pageList.loading[pageId];

export function CustomURLSlug(props: CustomURLSlugProp) {
  const { page } = props;
  const applicationVersion = useSelector(selectApplicationVersion);
  const [customSlug, setCustomSlug] = useState(page.customSlug || "");
  const [isSlugValid, setIsSlugValid] = useState(true);
  const dispatch = useDispatch();
  const isLoading = useSelector(isPageLoading(page.pageId));

  useEffect(() => {
    setCustomSlug(page.customSlug || "");
  }, [page.customSlug]);

  const noSpecialCharactersValidator = useCallback(
    (text: string) => {
      const noSpecialCharacters = /^[A-Za-z0-9\-]+$/;
      const isValid = !text || noSpecialCharacters.test(text);
      setIsSlugValid(isValid);
      return {
        isValid,
        message: isValid ? "" : "No special character allowed",
      };
    },
    [setIsSlugValid],
  );

  const saveSlug = useCallback(() => {
    dispatch(setPageSlug({ customSlug, pageId: page.pageId }));
  }, [page.pageId, customSlug]);

  const resetCustomSlug = useCallback(() => {
    dispatch(setPageSlug({ customSlug: "", pageId: page.pageId }));
  }, [page.pageId]);

  const onChange = useCallback(
    (value: string) => {
      setCustomSlug(value);
    },
    [setCustomSlug],
  );

  if (applicationVersion < ApplicationVersion.SLUG_URL) return null;
  return (
    <div className="flex flex-row justify-start mb-2 px-1">
      <div className="flex flex-row justify-start gap-1 items-center">
        <span className="text-xs url">{`${window.location.origin}/app/`}</span>
        <TextInput
          height="32px"
          onChange={onChange}
          validator={noSpecialCharactersValidator}
          value={customSlug}
        />
        <span className="text-xs url">-{page.pageId}</span>
        <div className="flex flex-row gap-2 items-center">
          <Button
            category={Category.primary}
            disabled={
              page.customSlug === customSlug ||
              !isSlugValid ||
              customSlug === ""
            }
            isLoading={isLoading}
            onClick={saveSlug}
            text="save"
          />
          {page.customSlug && (
            <Button
              category={Category.tertiary}
              onClick={resetCustomSlug}
              tag="button"
              text="reset to default"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PageListItem;
