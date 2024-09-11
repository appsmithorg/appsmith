import React, { useState } from "react";
import styled from "styled-components";
import type { DebouncedFunc } from "lodash";
import {
  Button,
  Menu,
  MenuItem,
  MenuContent,
  MenuTrigger,
  SearchInput,
  Tooltip,
} from "@appsmith/ads";
import { HeaderWrapper } from "pages/AdminSettings/components";
import { SettingsHeader } from "components/utils/helperComponents";
import { ARE_YOU_SURE, createMessage } from "ee/constants/messages";
import { useMediaQuery } from "react-responsive";

interface PageHeaderProps {
  buttonText?: string;
  searchPlaceholder: string;
  onButtonClick?: () => void;
  onSearch?: DebouncedFunc<(search: string) => void>;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pageMenuItems: any[];
  title?: string;
  showMoreOptions?: boolean;
  showSearchNButton?: boolean;
}

const Container = styled.div<{ isMobile?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: ${(props) => (props.isMobile ? "wrap" : "nowrap")};
  min-height: 36px;
`;

const SearchWrapper = styled.div`
  width: 100%;
`;

const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;

  .actions-icon {
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    menuItem: any,
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
                {pageMenuItems &&
                  pageMenuItems.map((menuItem) => (
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
        </ActionsWrapper>
      </Container>
    </Container>
  );
}
