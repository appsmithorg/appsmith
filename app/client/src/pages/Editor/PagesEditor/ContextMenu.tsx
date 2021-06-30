import { get } from "lodash";
import React, { useCallback, useState } from "react";
import styled, { useTheme } from "styled-components";

import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import { Popover2 } from "@blueprintjs/popover2";

import { ControlIcons } from "icons/ControlIcons";
import { FormIcons } from "icons/FormIcons";
import { Page } from "constants/ReduxActionConstants";
import Toggle from "components/ads/Toggle";
import { Action } from "./PageListItem";
import EditName from "./EditName";

// render over popover portals
const Container = styled.div`
  padding: 12px;
  width: 280px;
  background-color: ${(props) => props.theme.colors.propertyPane.bg};

  h4 {
    margin: 0;
    margin-top: 8px;
    margin-bottom: 10px;
    font-weight: normal;
    font-size: 12px;
    text-transform: uppercase;
  }

  main {
    padding: 4px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  border-bottom: 1px solid ${(props) => props.theme.borders[2].color};
  padding-bottom: 8px;
`;

const MenuItem = styled.div`
  display: flex;
  margin-top: 14px;
  align-items: center;

  & > div {
    flex-grow: 1;
    font-size: 12px;
  }
`;

const MenuItemToggle = styled(Toggle)`
  flex-basis: 48px;
  height: 23px;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;

  & > div {
    margin-left: 4px;
  }
`;

const PageName = styled.div`
  flex-grow: 1;

  & > h1 {
    font-weight: normal;
    margin: 0;
    font-size: 14px;
    width: 150px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const DeleteIcon = FormIcons.DELETE_ICON;
const CloseIcon = ControlIcons.CLOSE_CONTROL;
const CopyIcon = ControlIcons.COPY_CONTROL;
const SettingsIcon = ControlIcons.SETTINGS_CONTROL;

type Props = {
  page: Page;
  applicationId: string;
  onSetPageHidden: () => void;
  onCopy: (pageId: string) => void;
  onDelete: (pageId: string, pageName: string) => void;
  onSetPageDefault: (pageId: string, applicationId?: string) => void;
};

function ContextMenu(props: Props) {
  const {
    applicationId,
    onCopy,
    onDelete,
    onSetPageDefault,
    onSetPageHidden,
    page,
  } = props;
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleInteraction = useCallback((isOpen) => {
    setIsOpen(isOpen);
  }, []);

  return (
    <Popover2
      content={
        <Container>
          <Header>
            <PageName>
              <EditName applicationId={applicationId} page={page} />
            </PageName>
            <Actions>
              <Action>
                <CopyIcon
                  color={get(theme, "colors.propertyPane.iconColor")}
                  height={16}
                  onClick={() => onCopy(page.pageId)}
                  width={16}
                />
              </Action>
              <Action>
                <DeleteIcon
                  color={
                    page.isDefault
                      ? get(theme, "colors.propertyPane.deleteIconColor")
                      : get(theme, "colors.propertyPane.iconColor")
                  }
                  disabled={page.isDefault}
                  height={16}
                  onClick={() => onDelete(page.pageId, page.pageName)}
                  width={16}
                />
              </Action>
              <Action>
                <CloseIcon
                  color={
                    page.isDefault
                      ? get(theme, "colors.propertyPane.deleteIconColor")
                      : get(theme, "colors.propertyPane.iconColor")
                  }
                  height={16}
                  onClick={() => setIsOpen(false)}
                  width={16}
                />
              </Action>
            </Actions>
          </Header>
          <main>
            <h4>General</h4>
            {!page.isDefault && (
              <MenuItem>
                <div>Set Homepage</div>
                <MenuItemToggle
                  onToggle={() => onSetPageDefault(page.pageId, applicationId)}
                  value={page.isDefault}
                />
              </MenuItem>
            )}

            <MenuItem>
              <div>IsVisible</div>
              <MenuItemToggle
                onToggle={onSetPageHidden}
                value={!page.isHidden}
              />
            </MenuItem>
          </main>
        </Container>
      }
      isOpen={isOpen}
      minimal
      onInteraction={handleInteraction}
      placement={"bottom-start"}
      portalClassName="pages-editor-context-menu"
    >
      <Action className={isOpen ? "active" : ""} type="button">
        <SettingsIcon
          color={get(theme, "colors.propertyPane.iconColor")}
          height={16}
          onClick={() => {
            //
          }}
          width={16}
        />
      </Action>
    </Popover2>
  );
}

export default ContextMenu;
