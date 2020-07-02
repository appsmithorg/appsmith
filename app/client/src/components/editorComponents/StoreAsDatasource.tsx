import { Menu, MenuItem, Popover, Position } from "@blueprintjs/core";
import { ControlIcons } from "icons/ControlIcons";
import { theme } from "constants/DefaultTheme";
import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import { IconWrapper } from "constants/IconConstants";
import { ReactComponent as StorageIcon } from "assets/icons/menu/storage.svg";
import { storeAsDatasource } from "actions/datasourceActions";
import { useDispatch } from "react-redux";

type Props = {};

const StyledMenu = styled(Menu)`
  &&&&.bp3-menu {
    padding: 8px;
    background: #ffffff;
    border: 1px solid #ebeff2;
    box-sizing: border-box;
    box-shadow: 0px 2px 4px rgba(67, 70, 74, 0.14);
    border-radius: 4px;
  }
`;

const StyledMenuItem = styled(MenuItem)`
  &&&&.bp3-menu-item {
    align-items: center;
    width: 202px;
    justify-content: center;
  }
`;

const TooltipStyles = createGlobalStyle`
 .helper-tooltip{
  .bp3-popover {
    margin-right: 10px;
    margin-top: 5px;
  }
 }
`;

const StoreAsDatasource = (props: Props) => {
  const dispatch = useDispatch();
  const MenuContainer = (
    <StyledMenu>
      <StyledMenuItem
        icon={
          <IconWrapper
            width={theme.fontSizes[4]}
            height={theme.fontSizes[4]}
            color={"#535B62"}
          >
            <StorageIcon />
          </IconWrapper>
        }
        text="Store as datasource"
        onClick={() => dispatch(storeAsDatasource())}
      />
    </StyledMenu>
  );
  return (
    <>
      <TooltipStyles />
      <Popover
        content={MenuContainer}
        position={Position.BOTTOM_LEFT}
        usePortal
        portalClassName="helper-tooltip"
      >
        <div
          onMouseDown={e => {
            e.stopPropagation();
          }}
        >
          <ControlIcons.MORE_HORIZONTAL_CONTROL
            width={theme.fontSizes[4]}
            height={theme.fontSizes[4]}
            color="#C4C4C4"
          />
        </div>
      </Popover>
    </>
  );
};

export default StoreAsDatasource;
