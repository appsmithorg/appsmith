import React, { useState } from "react";
import { ReactComponent as Layout } from "assets/icons/ads/layout-7.svg";
import { ReactComponent as Database } from "assets/icons/ads/database-3.svg";
import { ReactComponent as AddPage } from "assets/icons/ads/file-add-line.svg";
import { Popover2 } from "@blueprintjs/popover2";
import { TooltipComponent as Tooltip, Text, TextType } from "design-system";
import { EntityClassNames } from "../Entity";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { Position } from "@blueprintjs/core";
import EntityAddButton from "../Entity/AddButton";
import styled from "styled-components";
import history from "utils/history";
import { generateTemplateFormURL } from "RouteBuilder";
import { useParams } from "react-router";
import { useDispatch } from "react-redux";
import { ExplorerURLParams } from "../helpers";
import { showTemplatesModal } from "actions/templateActions";
import { Colors } from "constants/Colors";
import {
  ADD_PAGE_FROM_TEMPLATE,
  ADD_PAGE_TOOLTIP,
  createMessage,
  CREATE_PAGE,
  GENERATE_PAGE_ACTION_TITLE,
} from "@appsmith/constants/messages";

const MenuItem = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spaces[3]}px;
  height: 40px;
  width: 250px;
  align-items: center;
  padding-left: ${(props) => props.theme.spaces[7]}px;
  svg {
    height: 16px;
    width: 16px;
  }
  cursor: pointer;

  &:hover {
    background-color: ${Colors.GREY_2};
  }
`;

type SubMenuProps = {
  className: string;
  openMenu: boolean;
  onMenuClose: () => void;
  createPageCallback: () => void;
};

function AddPageContextMenu({
  className,
  createPageCallback,
  onMenuClose,
  openMenu,
}: SubMenuProps) {
  const [show, setShow] = useState(openMenu);
  const dispatch = useDispatch();
  const { pageId } = useParams<ExplorerURLParams>();

  const ContextMenuItems = [
    {
      title: createMessage(CREATE_PAGE),
      icon: <AddPage />,
      onClick: createPageCallback,
      "data-cy": "add-page",
    },
    {
      title: createMessage(GENERATE_PAGE_ACTION_TITLE),
      icon: <Database />,
      onClick: () => history.push(generateTemplateFormURL({ pageId })),
      "data-cy": "generate-page",
    },
    {
      title: createMessage(ADD_PAGE_FROM_TEMPLATE),
      icon: <Layout />,
      onClick: () => dispatch(showTemplatesModal(true)),
      "data-cy": "add-page-from-template",
    },
  ];

  const onMenuItemClick = (item: any) => {
    setShow(false);
    item.onClick();
  };

  return (
    <Popover2
      className="file-ops"
      content={
        <>
          {ContextMenuItems.map((item) => {
            return (
              <MenuItem
                data-cy={item["data-cy"]}
                key={item.title}
                onClick={() => onMenuItemClick(item)}
              >
                {item.icon}
                <Text color={Colors.GRAY_700} type={TextType.P3}>
                  {item.title}
                </Text>
              </MenuItem>
            );
          })}
        </>
      }
      isOpen={show}
      minimal
      onClose={() => {
        setShow(false);
        onMenuClose();
      }}
      placement="right-start"
    >
      <Tooltip
        boundary="viewport"
        className={EntityClassNames.TOOLTIP}
        content={createMessage(ADD_PAGE_TOOLTIP)}
        disabled={show}
        hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
        position={Position.RIGHT}
      >
        <EntityAddButton
          className={`${className} ${show ? "selected" : ""}`}
          onClick={() => setShow(true)}
        />
      </Tooltip>
    </Popover2>
  );
}

export default AddPageContextMenu;
