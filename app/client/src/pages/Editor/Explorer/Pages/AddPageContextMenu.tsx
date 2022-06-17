import React, { useState } from "react";
import { ReactComponent as Layout } from "assets/icons/ads/layout-7.svg";
import { ReactComponent as Database } from "assets/icons/ads/database-3.svg";
import { ReactComponent as AddPage } from "assets/icons/ads/file-add-line.svg";
import { Popover2 } from "@blueprintjs/popover2";
import Text, { TextType } from "components/ads/Text";
import TooltipComponent from "components/ads/Tooltip";
import { EntityClassNames } from "../Entity";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { Position } from "@blueprintjs/core";
import EntityAddButton from "../Entity/AddButton";
import styled from "styled-components";
import history from "utils/history";
import { generateTemplateFormURL } from "RouteBuilder";
import { useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { ExplorerURLParams } from "../helpers";
import { selectURLSlugs } from "selectors/editorSelectors";
import { showTemplatesModal } from "actions/templateActions";

const MenuItem = styled.div`
  display: flex;
  gap: 10px;
  height: 40px;
  width: 250px;
  align-items: center;
  padding-left: 16px;
  svg {
    height: 16px;
    width: 16px;
  }
  cursor: pointer;

  &:hover {
    background-color: #f1f1f1;
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
  const { applicationSlug, pageSlug } = useSelector(selectURLSlugs);

  const ContextMenuItems = [
    {
      title: "Create a blank page",
      icon: <AddPage />,
      onClick: createPageCallback,
    },
    {
      title: "Generate page from data table",
      icon: <Database />,
      onClick: () =>
        history.push(
          generateTemplateFormURL({ applicationSlug, pageSlug, pageId }),
        ),
    },
    {
      title: "Add page from template",
      icon: <Layout />,
      onClick: () => dispatch(showTemplatesModal(true)),
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
              <MenuItem key={item.title} onClick={() => onMenuItemClick(item)}>
                {item.icon}
                <Text color={"#575757"} type={TextType.P3}>
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
      <TooltipComponent
        boundary="viewport"
        className={EntityClassNames.TOOLTIP}
        content={"Add a new page"}
        disabled={show}
        hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
        position={Position.RIGHT}
      >
        <EntityAddButton
          className={`${className} ${show ? "selected" : ""}`}
          onClick={() => setShow(true)}
        />
      </TooltipComponent>
    </Popover2>
  );
}

export default AddPageContextMenu;
