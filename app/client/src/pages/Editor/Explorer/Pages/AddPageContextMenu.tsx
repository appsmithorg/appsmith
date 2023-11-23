import React, { useMemo, useState } from "react";
import { AddButtonWrapper, EntityClassNames } from "../Entity";
import EntityAddButton from "../Entity/AddButton";
import styled from "styled-components";
import history from "utils/history";
import { generateTemplateFormURL } from "@appsmith/RouteBuilder";
import { useParams } from "react-router";
import { useDispatch } from "react-redux";
import type { ExplorerURLParams } from "@appsmith/pages/Editor/Explorer/helpers";
import { showTemplatesModal } from "actions/templateActions";
import {
  ADD_PAGE_FROM_TEMPLATE,
  ADD_PAGE_TOOLTIP,
  CANVAS_NEW_PAGE_CARD,
  createMessage,
  CREATE_PAGE,
  GENERATE_PAGE_ACTION_TITLE,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  Menu,
  MenuContent,
  MenuTrigger,
  MenuItem,
  Tooltip,
  Text,
} from "design-system";
import { isAirgapped } from "@appsmith/utils/airgapHelpers";
import { TOOLTIP_HOVER_ON_DELAY_IN_S } from "constants/AppConstants";
import {
  LayoutSystemFeatures,
  useLayoutSystemFeatures,
} from "layoutSystems/common/useLayoutSystemFeatures";

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
}

function AddPageContextMenu({
  className,
  createPageCallback,
  onMenuClose,
  openMenu,
}: SubMenuProps) {
  const [show, setShow] = useState(openMenu);
  const dispatch = useDispatch();
  const { pageId } = useParams<ExplorerURLParams>();
  const isAirgappedInstance = isAirgapped();

  const checkLayoutSystemFeatures = useLayoutSystemFeatures();
  const [enableForkingFromTemplates] = checkLayoutSystemFeatures([
    LayoutSystemFeatures.ENABLE_FORKING_FROM_TEMPLATES,
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
      {
        title: createMessage(GENERATE_PAGE_ACTION_TITLE),
        icon: "database-2-line",
        onClick: () => history.push(generateTemplateFormURL({ pageId })),
        "data-testid": "generate-page",
        key: "GENERATE_PAGE",
      },
    ];

    if (enableForkingFromTemplates && !isAirgappedInstance) {
      items.push({
        title: createMessage(ADD_PAGE_FROM_TEMPLATE),
        icon: "layout-2-line",
        onClick: () => dispatch(showTemplatesModal(true)),
        "data-testid": "add-page-from-template",
        key: "ADD_PAGE_FROM_TEMPLATE",
      });
    }

    return items;
  }, [pageId]);

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
