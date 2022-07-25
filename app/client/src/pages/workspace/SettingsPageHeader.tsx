import React, { useState } from "react";
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
import { HeaderWrapper, SettingsHeader } from "pages/Settings/components";
import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { HelpPopoverStyle, StyledSearchInput } from "./helperComponents";
import { ARE_YOU_SURE, createMessage } from "@appsmith/constants/messages";
import { useMediaQuery } from "react-responsive";

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

const Container = styled.div<{ isMobile?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: ${(props) => (props.isMobile ? "wrap" : "nowrap")};
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

const SearchWrapper = styled.div`
  width: 100%;
`;

const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;

export function SettingsPageHeader(props: PageHeaderProps) {
  const [showConfirmationText, setShowConfirmationText] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(props.isEditingTitle || false);

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

  const isMobile: boolean = useMediaQuery({ maxWidth: 767 });

  return (
    <Container isMobile={isMobile}>
      <HeaderWrapper margin={`0px`}>
        {isTitleEditable ? (
          <SettingsHeader data-testid="t--editatble-title">
            <EditableText
              className="t--editable-title"
              defaultValue={title || "Members"}
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
          <SettingsHeader data-testid="t--page-title">{title}</SettingsHeader>
        )}
      </HeaderWrapper>
      <Container isMobile={isMobile}>
        <SearchWrapper>
          {onSearch && (
            <StyledSearchInput
              className="acl-search-input"
              data-testid={"t--acl-search-input"}
              onChange={handleSearch}
              placeholder={searchPlaceholder}
              variant={SearchVariant.BACKGROUND}
              width={isMobile ? "100%" : "376px"}
            />
          )}
        </SearchWrapper>
        {/* <VerticalDelimeter /> */}
        <ActionsWrapper>
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
        </ActionsWrapper>
      </Container>
    </Container>
  );
}
