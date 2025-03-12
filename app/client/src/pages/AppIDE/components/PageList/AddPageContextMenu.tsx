import React, { useMemo, useState } from "react";
import {
  AddButtonWrapper,
  EntityClassNames,
} from "pages/Editor/Explorer/Entity";
import EntityAddButton from "pages/Editor/Explorer/Entity/AddButton";
import styled from "styled-components";
import {
  ADD_PAGE_TOOLTIP,
  CANVAS_NEW_PAGE_CARD,
  createMessage,
  CREATE_PAGE,
} from "ee/constants/messages";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { ButtonSizes } from "@appsmith/ads";
import {
  Menu,
  MenuContent,
  MenuTrigger,
  MenuItem,
  Tooltip,
  Text,
} from "@appsmith/ads";
import { TOOLTIP_HOVER_ON_DELAY_IN_S } from "constants/AppConstants";
import { useGenPageItems } from "ee/pages/AppIDE/hooks/useGenPageItems";

const Wrapper = styled.div`
  .title {
    display: flex;
    padding: ${(props) =>
      `${props.theme.spaces[4]}px ${props.theme.spaces[4]}px`};
  }
`;

interface SubMenuProps {
  className: string;
  openMenu: boolean;
  onMenuClose: () => void;
  createPageCallback: () => void;
  buttonSize?: ButtonSizes;
  onItemSelected?: () => void;
}

function AddPageContextMenu({
  buttonSize,
  className,
  createPageCallback,
  onItemSelected,
  onMenuClose,
  openMenu,
}: SubMenuProps) {
  const [show, setShow] = useState(openMenu);

  const ContextMenuGeneratePageItems = useGenPageItems();
  const ContextMenuItems = useMemo(() => {
    const items = [
      {
        title: createMessage(CREATE_PAGE),
        icon: "file-add-line",
        onClick: createPageCallback,
        "data-testid": "add-page",
        key: "CREATE_PAGE",
      },
      ...ContextMenuGeneratePageItems,
    ];

    return items;
  }, [createPageCallback, ContextMenuGeneratePageItems]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // handle open
    } else {
      // handle close
      onMenuClose();
    }

    setShow(open);
  };

  const onMenuItemClick = (item: (typeof ContextMenuItems)[number]) => {
    if (onItemSelected) onItemSelected();

    handleOpenChange(false);
    item.onClick();
    AnalyticsUtil.logEvent("ENTITY_EXPLORER_ADD_PAGE_CLICK", {
      item: item.key,
    });
  };

  return (
    <Menu open={show}>
      <MenuTrigger asChild={false}>
        <Tooltip
          content={createMessage(ADD_PAGE_TOOLTIP)}
          mouseEnterDelay={TOOLTIP_HOVER_ON_DELAY_IN_S}
          placement="right"
        >
          <AddButtonWrapper>
            <EntityAddButton
              buttonSize={buttonSize}
              className={`${className} ${show ? "selected" : ""}`}
              onClick={() => handleOpenChange(true)}
            />
          </AddButtonWrapper>
        </Tooltip>
      </MenuTrigger>
      <MenuContent
        align="start"
        onInteractOutside={() => handleOpenChange(false)}
        side="right"
      >
        <Wrapper className={EntityClassNames.CONTEXT_MENU_CONTENT} tabIndex={0}>
          <Text className="title" kind="heading-xs">
            {createMessage(CANVAS_NEW_PAGE_CARD)}
          </Text>
          {ContextMenuItems.map((item) => {
            return (
              <MenuItem
                key={item.title}
                onClick={() => onMenuItemClick(item)}
                startIcon={item.icon}
              >
                {item.title}
              </MenuItem>
            );
          })}
        </Wrapper>
      </MenuContent>
    </Menu>
  );
}

export default AddPageContextMenu;
