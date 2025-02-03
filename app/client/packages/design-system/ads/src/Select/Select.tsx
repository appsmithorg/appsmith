import React, { useRef, useState } from "react";
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
    maxTagCount = isMultiSelect
      ? props.value?.length > 1
        ? "responsive"
        : 1
      : undefined,
    maxTagPlaceholder,
    optionLabelProp = "label",
    placeholder = "Please select an option",
    showSearch = false,
    size = "md",
    virtual = false,
    ...rest
  } = props;
  const searchRef = useRef<HTMLInputElement>(null);
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

  const handleDropdownVisibleChange = (open: boolean) => {
    if (open) {
      // this is a hack to get the search input to focus when the dropdown is opened
      // the reason is, rc-select does not support putting the search input in the dropdown
      // and rc-select focus its native searchinput element on dropdown open, but we need to focus the search input
      // so we use a timeout to focus the search input after the dropdown is opened
      setTimeout(() => {
        if (!searchRef.current) return;

        searchRef.current?.focus();
      }, 200);

      return;
    }

    setSearchValue("");
  };

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
                ref={searchRef}
                size="md"
                value={searchValue}
              />
            )}
            {menu}
          </div>
        );
      }}
      inputIcon={<InputIcon />}
      maxTagCount={maxTagCount}
      maxTagPlaceholder={maxTagPlaceholder || getMaxTagPlaceholder}
      menuItemSelectedIcon=""
      mode={isMultiSelect ? "tags" : undefined}
      onDropdownVisibleChange={handleDropdownVisibleChange}
      optionLabelProp={optionLabelProp}
      placeholder={placeholder}
      searchValue={searchValue}
      showArrow
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
