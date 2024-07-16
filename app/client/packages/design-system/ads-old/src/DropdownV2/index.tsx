import React, { useState } from "react";
import styled from "styled-components";
import _ from "lodash";
import type {
  IMenuItemProps,
  IMenuProps,
  IPopoverProps,
} from "@blueprintjs/core";
import { Menu, MenuItem, Popover } from "@blueprintjs/core";
import SearchComponent from "../SearchComponent";
import { HighlightText } from "../HighlightText";
import Text, { TextType } from "../Text";

/**
 * ----------------------------------------------------------------------------
 * TYPES
 *-----------------------------------------------------------------------------
 */

interface Props {
  enableSearch?: boolean;
  searchPlaceholder?: string;
  children: React.ReactElement[] | React.ReactElement;
}

/**
 * ----------------------------------------------------------------------------
 * STYLED
 *-----------------------------------------------------------------------------
 */

const StyledMenuItem = styled(MenuItem)`
  margin: 0;
  padding: 8px;
`;

const StyledMenu = styled(Menu)`
  margin: 0;
  padding: 0;
`;

const EmptyState = styled(MenuItem)`
  background-color: var(--ads-color-black-100);
`;

const EmptyStateText = styled.div`
  display: flex;
  flex-direction: column;
`;

/**
 * ----------------------------------------------------------------------------
 * COMPONENTS
 *-----------------------------------------------------------------------------
 */
function DropdownV2(props: IPopoverProps & Props) {
  const { children, enableSearch, searchPlaceholder, ...rest } = props;

  // Find the menu items from the children of dropdown and assign it
  const [menuItems, setMenuItems] = useState(
    (Array.isArray(children) &&
      children.find(
        (child: any) => child.type.displayName === "DropdownList",
      )) ||
      undefined,
  );

  // handle search and filtering of options on menu items
  const [searchValue, setSearchValue] = useState("");
  const onOptionSearch = (searchStr: string) => {
    setSearchValue(searchStr);
    const search = searchStr.toLocaleUpperCase();
    const filteredOptions: Array<MenuItem> = menuItems?.props.children?.filter(
      (menuItem: MenuItem) => {
        return menuItem.props.text
          ?.toLocaleString()
          .toLocaleUpperCase()
          .includes(search);
      },
    );

    // handle case when search string doesn't have any matches
    _.isEmpty(filteredOptions)
      ? setMenuItems(
          <DropdownList {...menuItems?.props}>
            <EmptyState
              text={
                <EmptyStateText>
                  <Text color={"var(--ads-color-black-500)"} type={TextType.P1}>
                    No results found
                  </Text>
                  <Text color={"var(--ads-color-black-500)"} type={TextType.P3}>
                    Try to search a different keyword
                  </Text>
                </EmptyStateText>
              }
            />
          </DropdownList>,
        )
      : setMenuItems(
          <DropdownList {...menuItems?.props}>
            {filteredOptions.map((option, key) => {
              const propsWithoutText = _.omit(option.props, ["text"]);
              // filtered options must highlight the sub string matched in the option
              return (
                <DropdownItem
                  {...propsWithoutText}
                  key={key}
                  text={
                    <HighlightText
                      highlight={search}
                      text={option.props.text?.toString() || ""}
                    />
                  }
                />
              );
            })}
          </DropdownList>,
        );
  };

  const trigger = enableSearch ? (
    <SearchComponent
      onSearch={onOptionSearch}
      placeholder={searchPlaceholder || "Type here"}
      value={searchValue}
    />
  ) : (
    Array.isArray(children) &&
    children.find((child: any) => child.type.displayName === "DropdownTrigger")
  );

  return (
    <Popover
      {...rest}
      canEscapeKeyClose
      content={menuItems}
      popoverClassName="dropdown-v2"
      transitionDuration={-1}
    >
      {trigger}
    </Popover>
  );
}

function DropdownList(props: IMenuProps) {
  return <StyledMenu {...props} />;
}

DropdownList.displayName = "DropdownList";

function DropdownTrigger(props: any) {
  return <div {...props} />;
}

DropdownTrigger.displayName = "DropdownTrigger";

function DropdownItem(props: IMenuItemProps) {
  return <StyledMenuItem {...props} />;
}

DropdownItem.displayName = "DropdownItem";

export { Props, DropdownV2, DropdownList, DropdownItem, DropdownTrigger };
