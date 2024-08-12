import React, { useCallback } from "react";
import { Button, Icon, Tooltip } from "@appsmith/ads";
import {
  CLOSE_ENTITY_EXPLORER_MESSAGE,
  LOCK_ENTITY_EXPLORER_MESSAGE,
  createMessage,
} from "ee/constants/messages";
import { modText } from "utils/helpers";
import classNames from "classnames";
import {
  setExplorerActiveAction,
  setExplorerPinnedAction,
} from "actions/explorerActions";
import { getExplorerPinned } from "selectors/explorerSelector";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";

export const SidebarNavButton = styled(Button)`
  .ads-v2-button__content {
    padding: 0;
  }
  .group {
    height: 36px;
    width: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export const LockEntityExplorer = ({
  isPreviewingApp = false,
}: {
  isPreviewingApp?: boolean;
}) => {
  const pinned = useSelector(getExplorerPinned);
  const dispatch = useDispatch();

  /**
   * on hovering the menu, make the explorer active
   */
  const onMenuHover = useCallback(() => {
    dispatch(setExplorerActiveAction(true));
  }, [setExplorerActiveAction]);

  /**
   * toggles the pinned state of sidebar
   */
  const onPin = useCallback(() => {
    dispatch(setExplorerPinnedAction(!pinned));
  }, [pinned, dispatch, setExplorerPinnedAction]);

  return (
    <Tooltip
      content={
        <div className="flex items-center justify-between">
          <span>
            {!pinned
              ? createMessage(LOCK_ENTITY_EXPLORER_MESSAGE)
              : createMessage(CLOSE_ENTITY_EXPLORER_MESSAGE)}
          </span>
          <span className="ml-4">{modText()} /</span>
        </div>
      }
      placement="bottomLeft"
    >
      <SidebarNavButton
        className={classNames({
          "transition-all transform duration-400": true,
          "-translate-x-full opacity-0": isPreviewingApp,
          "translate-x-0 opacity-100": !isPreviewingApp,
        })}
        data-testid="sidebar-nav-button"
        kind="tertiary"
        onClick={onPin}
        size="md"
      >
        <div
          className="t--pin-entity-explorer group relative"
          onMouseEnter={onMenuHover}
        >
          <Icon
            className="absolute transition-opacity group-hover:opacity-0"
            name="hamburger"
            size="md"
          />
          {pinned && (
            <Icon
              className="absolute transition-opacity opacity-0 group-hover:opacity-100"
              name="menu-fold"
              onClick={onPin}
              size="md"
            />
          )}
          {!pinned && (
            <Icon
              className="absolute transition-opacity opacity-0 group-hover:opacity-100"
              name="menu-unfold"
              onClick={onPin}
              size="md"
            />
          )}
        </div>
      </SidebarNavButton>
    </Tooltip>
  );
};
