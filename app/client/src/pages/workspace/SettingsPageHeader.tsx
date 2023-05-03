import React, { useState } from "react";
import styled from "styled-components";
import { Position } from "@blueprintjs/core";
import type { DebouncedFunc } from "lodash";
import type { MenuItemProps } from "design-system-old";
import { Menu, MenuItem } from "design-system-old";
import { Button, SearchInput, Tooltip } from "design-system";
import { HeaderWrapper } from "pages/Settings/components";
import {
  HelpPopoverStyle,
  SettingsHeader,
} from "components/utils/helperComponents";
import { ARE_YOU_SURE, createMessage } from "@appsmith/constants/messages";
import { useMediaQuery } from "react-responsive";

type PageHeaderProps = {
  buttonText?: string;
  searchPlaceholder: string;
  onButtonClick?: () => void;
  onSearch?: DebouncedFunc<(search: string) => void>;
  pageMenuItems: MenuItemProps[];
  title?: string;
  showMoreOptions?: boolean;
  showSearchNButton?: boolean;
};

const Container = styled.div<{ isMobile?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: ${(props) => (props.isMobile ? "wrap" : "nowrap")};

  .actions-icon {
    color: var(--appsmith-color-black-400);

    &:hover {
      color: var(--appsmith-color-black-700);
    }
  }
`;

const SearchWrapper = styled.div`
  width: 100%;
`;

const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;

  .menu-actions-icon {
    margin-left: 12px;
  }
`;

export function SettingsPageHeader(props: PageHeaderProps) {
  const [showConfirmationText, setShowConfirmationText] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const {
    buttonText,
    onSearch,
    pageMenuItems,
    searchPlaceholder,
    showMoreOptions,
    showSearchNButton = true,
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
        <Tooltip
          content={title}
          isDisabled={title && title.length < 32 ? true : false}
        >
          <SettingsHeader
            data-testid="t--page-title"
            kind="heading-m"
            renderAs="h2"
          >
            {title}
          </SettingsHeader>
        </Tooltip>
      </HeaderWrapper>
      <Container isMobile={isMobile}>
        <SearchWrapper>
          {onSearch && showSearchNButton && (
            <SearchInput
              UNSAFE_width={isMobile ? "100%" : "376px"}
              className="search-input"
              data-testid={"t--search-input"}
              onChange={handleSearch}
              placeholder={searchPlaceholder}
              size="md"
            />
          )}
        </SearchWrapper>
        {/* <VerticalDelimeter /> */}
        <ActionsWrapper>
          {buttonText && showSearchNButton && (
            <Button
              data-testid={"t--page-header-input"}
              onClick={props.onButtonClick}
              size="md"
            >
              {buttonText}
            </Button>
          )}
          {showMoreOptions && (
            <Menu
              canEscapeKeyClose
              canOutsideClickClose
              className="menu-actions-icon"
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
                <Button
                  className="actions-icon"
                  data-testid="t--page-header-actions"
                  isIconButton
                  kind="tertiary"
                  onClick={() => setShowOptions(!showOptions)}
                  size="sm"
                  startIcon="more-2-fill"
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
                    onSelect={(e: React.MouseEvent<HTMLInputElement>) => {
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
        </ActionsWrapper>
      </Container>
    </Container>
  );
}
