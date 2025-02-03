import React, { useState } from "react";
import RCSelect, {
  Option as RCOption,
  OptGroup as RCOptGroup,
} from "rc-select";
import clsx from "classnames";
import "./rc-styles.css";
import "./styles.css";

import { Icon } from "../Icon";
import { SelectClassName, SelectDropdownClassName } from "./Select.constants";
import { Tag } from "../Tag";
import type { SelectProps } from "./Select.types";
import { Spinner } from "../Spinner";
import { SearchInput } from "../SearchInput";

/*
  TODO:
  - Lots of warnings are generated from this component. Fix them.
  - Handle the case when the option selected is longer than the width of the select trigger.
  - when you click on an action on the page the select is on when the select is open, it should automatically trigger that action.
  ref https://www.notion.so/appsmith/cursor-pointer-isn-t-seen-when-a-dropdown-is-open-68f358f03dda4c708f84d7d7476217dc?d=f7682f4cb09f46e39487140437b220d9
 */
function Select(props: SelectProps) {
  const {
    children,
    className,
    dropdownClassName,
    isDisabled = false,
    isLoading = false,
    isMultiSelect,
    isValid,
    maxTagCount = "responsive",
    maxTagPlaceholder,
    placeholder = "Please select an option",
    showSearch = false,
    size = "md",
    virtual = false,
    ...rest
  } = props;
  const [searchValue, setSearchValue] = useState("");

  const getMaxTagPlaceholder = (omittedValues: any[]) => {
    return `+${omittedValues.length}`;
  };

  function InputIcon() {
    if (isLoading) {
      return <Spinner size="md" />;
    }

    return <Icon name="arrow-down-s-line" size="md" />;
  }

  return (
    <RCSelect
      {...rest}
      className={clsx(SelectClassName, className)}
      clearIcon={<Icon name="close-circle-line" size="md" />}
      data-is-valid={isValid}
      data-size={size}
      disabled={isDisabled || isLoading}
      dropdownClassName={clsx(
        SelectDropdownClassName,
        SelectDropdownClassName + `--${size}`,
        dropdownClassName,
      )}
      dropdownRender={(menu: any) => {
        return (
          <div>
            {showSearch && (
              <SearchInput
                onChange={setSearchValue}
                placeholder="Type to search..."
                size="md"
              />
            )}
            {menu}
          </div>
        );
      }}
      inputIcon={<InputIcon />}
      listHeight={300}
      maxTagCount={maxTagCount}
      maxTagPlaceholder={maxTagPlaceholder || getMaxTagPlaceholder}
      menuItemSelectedIcon=""
      mode={isMultiSelect ? "multiple" : undefined}
      onDropdownVisibleChange={(open) => {
        if (open) {
          setTimeout(() => searchRef.current?.focus(), 0);
        }
      }}
      placeholder={placeholder}
      searchValue={searchValue}
      showArrow
      showSearch={showSearch}
      tagRender={(props) => {
        if (rest.tagRender) {
          return rest.tagRender(props);
        }

        const { closable, label, onClose } = props;

        return (
          <Tag isClosable={closable} kind="info" onClose={onClose}>
            {label}
          </Tag>
        );
      }}
      virtual={virtual}
    >
      {children}
    </RCSelect>
  );
}

Select.displayName = "Select";

Select.defaultProps = {};

const Option = RCOption;
const OptGroup = RCOptGroup;

export { Select, Option, OptGroup };
