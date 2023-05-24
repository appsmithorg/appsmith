import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import styled from "styled-components";
import {
  HeaderWrapper,
  SettingsHeader,
  SettingsSubHeader,
} from "pages/Settings/components";
import { AclFactory } from "../config";

import EditableText, {
  EditInteractionKind,
} from "components/editorComponents/EditableText";
import { StyledSearchInput } from "./components";
import {
  ARE_YOU_SURE,
  createMessage,
  ENTER_ENTITY_DESC,
  ENTER_ENTITY_NAME,
} from "@appsmith/constants/messages";
import type { MenuItemProps, PageHeaderProps } from "./types";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Tooltip,
} from "design-system";

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
`;

const StyledButton = styled(Button)`
  margin-right: 8px;
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
`;

const StyledSettingsSubHeader = styled(SettingsSubHeader)`
  width: 90%;
  cursor: pointer;

  &.settings-sub-header {
    .bp3-editable-text {
      height: auto !important;

      &.bp3-editable-text-editing {
        padding: 5px;
        width: 100%;
        height: auto !important;
      }
    }

    .bp3-editable-text-content {
      white-space: break-spaces;
      height: auto !important;
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
      setTimeout(() => {
        setShowOptions(true);
        setShowConfirmationText(true);
        showConfirmationText && menuItem?.onSelect?.(e, "delete");
      }, 0);
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
    <Container alignItems="center" isHeaderEditable={isHeaderEditable}>
      <HeaderWrapper margin={`0px`}>
        {isHeaderEditable && onEditTitle ? (
          <StyledSettingsHeader
            className="settings-header"
            color="var(--ads-v2-color-fg-emphasis-plus)"
            data-testid="t--page-title"
            kind="heading-l"
            renderAs="h2"
          >
            <Tooltip
              content={title ?? pageTitle}
              isDisabled={(title ?? pageTitle).length < 40}
              placement="bottomLeft"
            >
              <EditableText
                className="t--editable-title"
                defaultValue={title ?? pageTitle}
                editInteractionKind={EditInteractionKind.SINGLE}
                isEditingDefault={isEditingTitle}
                isInvalid={(name) => !name || name.trim().length === 0}
                onBlur={() => {
                  setIsEditingTitle(false);
                }}
                onTextChanged={(name) => onEditTitle?.(name)}
                placeholder={createMessage(ENTER_ENTITY_NAME)}
                type="text"
              />
            </Tooltip>
          </StyledSettingsHeader>
        ) : (
          <Tooltip
            content={title ?? pageTitle}
            isDisabled={(title ?? pageTitle).length < 48}
            placement="bottomLeft"
          >
            <StyledSettingsHeader
              className="not-editable settings-header"
              color="var(--ads-v2-color-fg-emphasis-plus)"
              data-testid="t--page-title"
              kind="heading-l"
              renderAs="h1"
            >
              {title ?? pageTitle}
            </StyledSettingsHeader>
          </Tooltip>
        )}
        {isHeaderEditable && onEditDesc && (description || isEditingDesc) ? (
          <StyledSettingsSubHeader
            className="settings-sub-header"
            color="var(--ads-v2-color-fg-emphasis)"
            data-testid="t--page-description"
            kind="body-m"
            renderAs="h2"
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
              color="var(--ads-v2-color-fg-emphasis)"
              data-testid="t--page-description"
              kind="body-m"
              renderAs="span"
            >
              {description}
            </StyledSettingsSubHeader>
          )
        )}
      </HeaderWrapper>
      <Container alignItems="center" className="container-comp">
        {onSearch && (
          <StyledSearchInput
            className="acl-search-input"
            data-testid={"t--acl-search-input"}
            onChange={handleSearch}
            placeholder={searchPlaceholder}
            size="md"
            value={searchValue.toLowerCase()}
          />
        )}
        {buttonText && (
          <StyledButton
            data-testid={"t--acl-page-header-input"}
            isDisabled={disableButton}
            onClick={props.onButtonClick}
            size="md"
          >
            {buttonText}
          </StyledButton>
        )}
        {pageMenuItems && pageMenuItems.length > 0 && (
          <Menu
            onOpenChange={(open: boolean) => {
              if (showOptions) {
                setShowOptions(open);
                showConfirmationText && setShowConfirmationText(false);
              }
            }}
            open={showOptions}
          >
            <MenuTrigger>
              <Button
                className="actions-icon"
                data-testid="t--page-header-actions"
                isIconButton
                kind="tertiary"
                onClick={() => setShowOptions(!showOptions)}
                size="md"
                startIcon="more-2-fill"
              />
            </MenuTrigger>
            <MenuContent align="end">
              {pageMenuItems.map((menuItem) => (
                <MenuItem
                  className={`${menuItem.className} ${
                    menuItem.label === "delete" ? "error-menuitem" : ""
                  }`}
                  data-testid={`t--${menuItem.className}`}
                  key={menuItem.text}
                  onClick={(e: React.MouseEvent) => {
                    onOptionSelect(e, menuItem);
                  }}
                  startIcon={menuItem.icon}
                >
                  {showConfirmationText && menuItem.label === "delete"
                    ? createMessage(ARE_YOU_SURE)
                    : menuItem.text}
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
        )}
      </Container>
    </Container>
  );
}
