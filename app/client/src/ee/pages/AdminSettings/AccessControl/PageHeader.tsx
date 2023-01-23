import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import styled from "styled-components";
import { PopoverPosition, Position } from "@blueprintjs/core";
import {
  Button,
  IconSize,
  MenuItem,
  MenuItemProps,
  Icon,
  Menu,
  SearchVariant,
  TooltipComponent,
} from "design-system-old";
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
import {
  ARE_YOU_SURE,
  createMessage,
  ENTER_ENTITY_DESC,
  ENTER_ENTITY_NAME,
} from "@appsmith/constants/messages";
import { PageHeaderProps } from "./types";

const Container = styled.div<{
  isHeaderEditable?: boolean;
  alignItems?: string;
}>`
  display: flex;
  justify-content: space-between;
  align-items: ${({ alignItems }) => alignItems || `baseline`};

  > div:first-child {
    flex: ${({ isHeaderEditable }) =>
      isHeaderEditable ? `1 0 50%` : `1 1 50%`};
  }

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

const StyledSettingsHeader = styled(SettingsHeader)`
  max-width: 440px;
  cursor: pointer;

  &.not-editable {
    white-space: pre;
    text-overflow: ellipsis;
    overflow: hidden;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &.settings-header {
    span.bp3-popover-target {
      width: auto;

      > * {
        max-width: 100%;
        flex-grow: unset;
        width: auto;

        > * {
          width: 100%;
          .bp3-editable-text-content {
            display: block;
          }
        }
      }
    }
  }
`;

const StyledSettingsSubHeader = styled(SettingsSubHeader)`
  width: 90%;
  margin: 5px 0 5px 5px;

  &.settings-sub-header {
    .bp3-editable-text {
      padding: 0;

      &.bp3-editable-text-editing {
        padding: 5px;
        width: 100%;
        height: 100% !important;
      }
    }

    .bp3-editable-text-content {
      white-space: break-spaces;
    }
  }
`;

function getSettingLabel(name = "") {
  return name.replace(/-/g, "");
}

function getSettingDetail(category: string, selected: string) {
  return AclFactory.getCategoryDetails(category, selected);
}

export function PageHeader(props: PageHeaderProps) {
  const [showConfirmationText, setShowConfirmationText] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(
    props.isEditingTitle || false,
  );
  const [isEditingDesc, setIsEditingDesc] = useState(
    props.isEditingDesc || false,
  );
  const params = useParams() as any;
  const { category, selected } = params;
  const details = getSettingDetail(category, selected);
  const pageTitle = getSettingLabel(details?.title || (selected ?? category));
  const {
    buttonText,
    description = "",
    disableButton,
    isHeaderEditable,
    onEditDesc,
    onEditTitle,
    onSearch,
    pageMenuItems,
    searchPlaceholder,
    searchValue,
    title,
  } = props;

  useEffect(() => {
    setIsEditingTitle(props.isEditingTitle || false);
  }, [props.isEditingTitle]);

  useEffect(() => {
    setIsEditingDesc(props.isEditingDesc || false);
  }, [props.isEditingDesc]);

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
      setIsEditingTitle(true);
      setShowOptions(false);
    } else if (menuItem.label === "rename-desc") {
      setIsEditingDesc(true);
      setShowOptions(false);
    } else {
      setShowConfirmationText(false);
      setShowOptions(false);
      menuItem?.onSelect?.(e, "other");
    }
  };

  return (
    <Container isHeaderEditable={isHeaderEditable}>
      <HeaderWrapper margin={`0px`}>
        {isHeaderEditable && onEditTitle ? (
          <StyledSettingsHeader
            className="settings-header"
            data-testid="t--page-title"
          >
            <TooltipComponent
              boundary="viewport"
              content={title ?? pageTitle}
              disabled={(title ?? pageTitle).length < 40}
              maxWidth="400px"
              position={PopoverPosition.BOTTOM_LEFT}
            >
              <EditableText
                className="t--editable-title"
                defaultValue={title ?? pageTitle}
                editInteractionKind={EditInteractionKind.SINGLE}
                isEditingDefault={isEditingTitle}
                isInvalid={(name) => !name || name.trim().length === 0}
                onBlur={() => setIsEditingTitle(false)}
                onTextChanged={(name) => onEditTitle?.(name)}
                placeholder={createMessage(ENTER_ENTITY_NAME)}
                type="text"
              />
            </TooltipComponent>
          </StyledSettingsHeader>
        ) : (
          <TooltipComponent
            boundary="viewport"
            content={title ?? pageTitle}
            disabled={(title ?? pageTitle).length < 48}
            maxWidth="400px"
            position={PopoverPosition.BOTTOM_LEFT}
          >
            <StyledSettingsHeader
              className="not-editable settings-header"
              data-testid="t--page-title"
            >
              {title ?? pageTitle}
            </StyledSettingsHeader>
          </TooltipComponent>
        )}
        {isHeaderEditable && onEditDesc && (description || isEditingDesc) ? (
          <StyledSettingsSubHeader
            className="settings-sub-header"
            data-testid="t--page-description"
          >
            <EditableText
              className="t--editable-description"
              defaultValue={description}
              editInteractionKind={EditInteractionKind.SINGLE}
              isEditingDefault={isEditingDesc}
              maxLength={140}
              maxLines={3}
              minLines={1}
              multiline
              onBlur={() => setIsEditingDesc(false)}
              onTextChanged={(desc) => onEditDesc?.(desc)}
              placeholder={createMessage(ENTER_ENTITY_DESC)}
              type="text"
              useFullWidth
            />
          </StyledSettingsSubHeader>
        ) : (
          description && (
            <StyledSettingsSubHeader
              className="not-editable settings-sub-header"
              data-testid="t--page-description"
            >
              {description}
            </StyledSettingsSubHeader>
          )
        )}
      </HeaderWrapper>
      <Container alignItems="center">
        {onSearch && (
          <StyledSearchInput
            className="acl-search-input"
            data-testid={"t--acl-search-input"}
            defaultValue={searchValue.toLowerCase()}
            onChange={handleSearch}
            placeholder={searchPlaceholder}
            variant={SearchVariant.BACKGROUND}
            width={"376px"}
          />
        )}
        {buttonText && (
          <StyledButton
            data-testid={"t--acl-page-header-input"}
            disabled={disableButton}
            height="36"
            onClick={props.onButtonClick}
            tag="button"
            text={buttonText}
          />
        )}
        {pageMenuItems && pageMenuItems.length > 0 && (
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
            {pageMenuItems.map((menuItem) => (
              <MenuItem
                className={menuItem.className}
                icon={menuItem.icon}
                key={menuItem.text}
                onSelect={(e: React.MouseEvent) => {
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
        )}
      </Container>
    </Container>
  );
}
