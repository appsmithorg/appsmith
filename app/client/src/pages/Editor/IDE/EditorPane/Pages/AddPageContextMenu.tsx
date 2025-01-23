import React, { useMemo, useState } from "react";
import { AddButtonWrapper, EntityClassNames } from "../Entity";
import EntityAddButton from "../Entity/AddButton";
import styled from "styled-components";
import { useParams } from "react-router";
import { useDispatch } from "react-redux";
import type { ExplorerURLParams } from "ee/pages/Editor/Explorer/helpers";
import { showTemplatesModal } from "actions/templateActions";
import {
  ADD_PAGE_FROM_TEMPLATE,
  ADD_PAGE_TOOLTIP,
  CANVAS_NEW_PAGE_CARD,
  createMessage,
  CREATE_PAGE,
  GENERATE_PAGE_ACTION_TITLE,
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
import { isAirgapped } from "ee/utils/airgapHelpers";
import { TOOLTIP_HOVER_ON_DELAY_IN_S } from "constants/AppConstants";
import {
  LayoutSystemFeatures,
  useLayoutSystemFeatures,
} from "layoutSystems/common/useLayoutSystemFeatures";
import { openGeneratePageModal } from "pages/Editor/GeneratePage/store/generatePageActions";

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
  const dispatch = useDispatch();
  const { basePageId } = useParams<ExplorerURLParams>();
  const isAirgappedInstance = isAirgapped();

  const checkLayoutSystemFeatures = useLayoutSystemFeatures();
  const [enableForkingFromTemplates, enableGenerateCrud] =
    checkLayoutSystemFeatures([
      LayoutSystemFeatures.ENABLE_FORKING_FROM_TEMPLATES,
      LayoutSystemFeatures.ENABLE_GENERATE_CRUD_APP,
    ]);

  const ContextMenuItems = useMemo(() => {
    const items = [
      {
        title: createMessage(CREATE_PAGE),
        icon: "file-add-line",
        onClick: createPageCallback,
        "data-testid": "add-page",
        key: "CREATE_PAGE",
      },
    ];

    if (enableGenerateCrud) {
      items.push({
        title: createMessage(GENERATE_PAGE_ACTION_TITLE),
        icon: "database-2-line",
        onClick: () => dispatch(openGeneratePageModal()),
        "data-testid": "generate-page",
        key: "GENERATE_PAGE",
      });
    }

    if (enableForkingFromTemplates && !isAirgappedInstance) {
      items.push({
        title: createMessage(ADD_PAGE_FROM_TEMPLATE),
        icon: "layout-2-line",
        onClick: () =>
          dispatch(showTemplatesModal({ isOpenFromCanvas: false })),
        "data-testid": "add-page-from-template",
        key: "ADD_PAGE_FROM_TEMPLATE",
      });
    }

    return items;
  }, [basePageId, enableGenerateCrud]);

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
