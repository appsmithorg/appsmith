import React, { useState } from "react";
import styled from "styled-components";
import { Position } from "@blueprintjs/core";
import type { DebouncedFunc } from "lodash";
import type { MenuItemProps } from "design-system-old";
import {
  Button,
  IconSize,
  Menu,
  MenuItem,
  Icon,
  SearchVariant,
} from "design-system-old";
import { HeaderWrapper } from "pages/Settings/components";
import {
  HelpPopoverStyle,
  StyledSearchInput,
  SettingsHeader,
} from "components/utils/helperComponents";
import { ARE_YOU_SURE, createMessage } from "@appsmith/constants/messages";
import { useMediaQuery } from "react-responsive";
import { TooltipComponent } from "design-system-old";

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
  min-width: 88px;
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
        <TooltipComponent
          content={title}
          disabled={title && title.length < 32 ? true : false}
        >
          <SettingsHeader data-testid="t--page-title">{title}</SettingsHeader>
        </TooltipComponent>
      </HeaderWrapper>
      <Container isMobile={isMobile}>
        <SearchWrapper>
          {onSearch && showSearchNButton && (
            <StyledSearchInput
              className="search-input"
              data-testid={"t--search-input"}
              onChange={handleSearch}
              placeholder={searchPlaceholder}
              variant={SearchVariant.BACKGROUND}
              width={isMobile ? "100%" : "376px"}
            />
          )}
        </SearchWrapper>
        {/* <VerticalDelimeter /> */}
        <ActionsWrapper>
          {buttonText && showSearchNButton && (
            <StyledButton
              data-testid={"t--page-header-input"}
              height="36"
              onClick={props.onButtonClick}
              tag="button"
              text={buttonText}
            />
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
