import React, { useState } from "react";
import { useParams } from "react-router";
import styled from "styled-components";
import { Position } from "@blueprintjs/core";
import { DebouncedFunc } from "lodash";
import {
  Button,
  IconSize,
  Menu,
  MenuItem,
  MenuItemProps,
  Icon,
  SearchVariant,
} from "components/ads";
import {
  HeaderWrapper,
  SettingsHeader,
  SettingsSubHeader,
} from "pages/Settings/components";
import { AclFactory } from "../config";

import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { HelpPopoverStyle, StyledSearchInput } from "./components";
import { ARE_YOU_SURE, createMessage } from "@appsmith/constants/messages";

type PageHeaderProps = {
  buttonText?: string;
  searchPlaceholder: string;
  onButtonClick?: () => void;
  onSearch?: DebouncedFunc<(search: string) => void>;
  pageMenuItems: MenuItemProps[];
  title?: string;
  isTitleEditable?: boolean;
  isEditingTitle?: boolean;
  onEditTitle?: (name: string) => void;
};

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    text-transform: unset;
  }

  .actions-icon {
    color: var(--appsmith-color-black-400);

    &:hover {
      color: var(--appsmith-color-black-700);
    }
  }
`;

const StyledButton = styled(Button)`
  flex: 1 0 auto;
  margin: 0 12px 0 0;
  min-width: 88px;
`;

/*const VerticalDelimeter = styled.div`
  margin: 0 16px;
  border-right: 2px solid var(--appsmith-color-black-200);
  height: 36px;
`;*/

function getSettingLabel(name = "") {
  return name.replace(/-/g, "");
}

function getSettingDetail(category: string, selected: string) {
  return AclFactory.getCategoryDetails(category, selected);
}

export function PageHeader(props: PageHeaderProps) {
  const [showConfirmationText, setShowConfirmationText] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(props.isEditingTitle || false);
  const params = useParams() as any;
  const { category, selected } = params;
  const details = getSettingDetail(category, selected);
  const pageTitle = getSettingLabel(details?.title || (selected ?? category));
  const {
    buttonText,
    isTitleEditable,
    onEditTitle,
    onSearch,
    pageMenuItems,
    searchPlaceholder,
    title,
  } = props;

  const handleSearch = (search: string) => {
    onSearch?.(search.toLocaleUpperCase());
  };

  const onOptionSelect = (
    e: React.MouseEvent<Element, MouseEvent>,
    menuItem: MenuItemProps,
  ) => {
    if (menuItem.label === "delete") {
      setShowOptions(true);
      setShowConfirmationText(true);
      showConfirmationText && menuItem?.onSelect?.(e, "delete");
    } else if (menuItem.label === "rename") {
      setIsEditing(true);
      setShowOptions(false);
    } else {
      setShowConfirmationText(false);
      setShowOptions(false);
      menuItem?.onSelect?.(e, "other");
    }
  };

  return (
    <Container>
      <HeaderWrapper margin={`0px`}>
        {isTitleEditable ? (
          <SettingsHeader data-testid="t--editatble-title">
            <EditableText
              className="t--editable-title"
              defaultValue={title ?? pageTitle}
              editInteractionKind={EditInteractionKind.DOUBLE}
              hideEditIcon
              isEditingDefault={isEditing}
              onBlur={() => setIsEditing(false)}
              onTextChanged={(name) => onEditTitle?.(name)}
              placeholder="Enter group name"
              type="text"
            />
          </SettingsHeader>
        ) : (
          <SettingsHeader>{title ?? pageTitle}</SettingsHeader>
        )}
        {details?.subText && (
          <SettingsSubHeader>{details.subText}</SettingsSubHeader>
        )}
      </HeaderWrapper>
      <Container>
        {onSearch && (
          <StyledSearchInput
            className="acl-search-input"
            data-testid={"t--acl-search-input"}
            onChange={handleSearch}
            placeholder={searchPlaceholder}
            variant={SearchVariant.BACKGROUND}
            width={"376px"}
          />
        )}
        {/* <VerticalDelimeter /> */}
        {buttonText && (
          <StyledButton
            data-testid={"t--acl-page-header-input"}
            height="36"
            onClick={props.onButtonClick}
            tag="button"
            text={buttonText}
          />
        )}
        <Menu
          canEscapeKeyClose
          canOutsideClickClose
          className="t--menu-actions-icon"
          isOpen={showOptions}
          menuItemWrapperWidth={"auto"}
          onClose={() => setShowOptions(false)}
          onClosing={() => {
            setShowConfirmationText(false);
            setShowOptions(false);
          }}
          onOpening={() => setShowOptions(true)}
          position={Position.BOTTOM_RIGHT}
          target={
            <Icon
              className="actions-icon"
              data-testid="t--page-header-actions"
              name="more-2-fill"
              onClick={() => setShowOptions(!showOptions)}
              size={IconSize.XXL}
            />
          }
        >
          <HelpPopoverStyle />
          {pageMenuItems &&
            pageMenuItems.map((menuItem) => (
              <MenuItem
                className={menuItem.className}
                icon={menuItem.icon}
                key={menuItem.text}
                onSelect={(e) => {
                  onOptionSelect(e, menuItem);
                }}
                text={
                  showConfirmationText && menuItem.label === "delete"
                    ? createMessage(ARE_YOU_SURE)
                    : menuItem.text
                }
                {...(showConfirmationText && menuItem.label === "delete"
                  ? { type: "warning" }
                  : {})}
              />
            ))}
        </Menu>
      </Container>
    </Container>
  );
}
