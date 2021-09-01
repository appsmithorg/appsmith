import React from "react";
import styled, { css, withTheme } from "styled-components";
import LetterIcon from "components/editorComponents/LetterIcon";
import ContextDropdown, {
  ContextDropdownOption,
} from "components/editorComponents/ContextDropdown";
import { MenuIcons } from "icons/MenuIcons";
import { Theme } from "constants/DefaultTheme";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Tooltip } from "@blueprintjs/core";

/** Page List Item */
export const PageListItemCSS = css`
  font-size: ${(props) => props.theme.fontSizes[3]}px;
  height: 40px;
  cursor: pointer;
  margin: 0px;
  padding: 0px 30px;
  display: flex;
  align-items: center;
`;

const PageListItemActiveCSS = css`
  background: ${(props) => props.theme.colors.paneInputBG};
`;

const PageListItemWrapper = styled.div<{ active: boolean }>`
  && {
    position: relative;
    ${PageListItemCSS}
    ${(props) => (props.active ? PageListItemActiveCSS : "")}
    &:hover {
      ${PageListItemActiveCSS}
    }
    & > div {
      width: 100%;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      & > div:first-of-type {
        margin-right: 10px;
      }
      & > div:last-of-type {
        margin: 0px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      & div > svg > path:first-of-type {
        fill: ${(props) => props.theme.colors.primaryOld};
      }
    }
    & .more {
      position: absolute;
      right: 10px;
      top: 10px;
    }
  }
`;
type PageListItemProps = {
  name: string;
  id: string;
  isDefault: boolean;
  updatePage: (pageId: string, name: string) => void;
  switchPage: (pageId: string) => void;
  active: boolean;
  contextActions: ContextDropdownOption[];
  theme: Theme;
};
const PageListItem = withTheme((props: PageListItemProps) => {
  const onEditPageName = (name: string) => {
    props.updatePage(props.id, name);
    AnalyticsUtil.logEvent("PAGE_RENAME", {
      pageName: props.name,
      newName: name,
      pageId: props.id,
    });
  };
  const pageIcon = props.isDefault ? (
    MenuIcons.HOMEPAGE_ICON({ width: 28, height: 28 })
  ) : (
    <LetterIcon text={String.fromCodePoint(props.name.codePointAt(0) || 0)} />
  );
  return (
    <PageListItemWrapper
      active={props.active}
      className={`t--page-sidebar-${props.name}`}
      onClick={() => props.switchPage(props.id)}
    >
      <div>
        {pageIcon}
        <Tooltip content="Double click to edit">
          <EditableText
            className="t--page-list-item"
            defaultValue={props.name}
            editInteractionKind={EditInteractionKind.DOUBLE}
            hideEditIcon
            onTextChanged={onEditPageName}
            placeholder="Enter page name"
            type="text"
          />
        </Tooltip>
      </div>
      <ContextDropdown
        className="more t--page-sidebar-menu-actions"
        options={props.contextActions}
        toggle={{
          type: "icon",
          icon: "MORE_VERTICAL_CONTROL",
          iconSize: props.theme.fontSizes[6],
        }}
      />
    </PageListItemWrapper>
  );
});

export default PageListItem;
