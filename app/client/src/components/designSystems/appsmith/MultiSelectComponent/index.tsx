import React, { useEffect, useState, useCallback, useRef } from "react";
import Select, { SelectProps } from "rc-select";
import { DefaultValueType } from "rc-select/lib/interface/generator";
import {
  DropdownStyles,
  inputIcon,
  MultiSelectContainer,
  StyledCheckbox,
} from "./index.styled";
import {
  CANVAS_CLASSNAME,
  MODAL_PORTAL_CLASSNAME,
} from "constants/WidgetConstants";

const menuItemSelectedIcon = (props: { isSelected: boolean }) => {
  return <StyledCheckbox checked={props.isSelected} />;
};

export interface MultiSelectProps
  extends Required<
    Pick<
      SelectProps,
      "disabled" | "options" | "placeholder" | "loading" | "dropdownStyle"
    >
  > {
  mode?: "multiple" | "tags";
  value: string[];
  onChange: (value: DefaultValueType) => void;
}

function MultiSelectComponent({
  disabled,
  dropdownStyle,
  loading,
  onChange,
  options,
  placeholder,
  value,
}: MultiSelectProps): JSX.Element {
  const [isSelectAll, setIsSelectAll] = useState(false);
  const _menu = useRef<HTMLElement | null>(null);

  const getDropdownPosition = useCallback((node: HTMLElement | null) => {
    if (Boolean(node?.closest(`.${MODAL_PORTAL_CLASSNAME}`))) {
      return document.querySelector(
        `.${MODAL_PORTAL_CLASSNAME}`,
      ) as HTMLElement;
    }
    // TODO: Use generateClassName func.
    return document.querySelector(`.${CANVAS_CLASSNAME}`) as HTMLElement;
  }, []);

  const handleSelectAll = () => {
    if (!isSelectAll) {
      const allOption: string[] = options.map((option) => option.value);
      onChange(allOption);
      return;
    }
    return onChange([]);
  };
  useEffect(() => {
    if (
      !isSelectAll &&
      options.length &&
      value.length &&
      options.length === value.length
    ) {
      setIsSelectAll(true);
    }
    if (isSelectAll && options.length !== value.length) {
      setIsSelectAll(false);
    }
  }, [options, value]);

  const dropdownRender = useCallback(
    (
      menu: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
    ) => (
      <>
        {options.length ? (
          <StyledCheckbox
            alignIndicator="left"
            checked={isSelectAll}
            label="Select all"
            onChange={handleSelectAll}
          />
        ) : null}
        {menu}
      </>
    ),
    [isSelectAll, options],
  );

  const filterOption = useCallback(
    (input, option) =>
      option?.props.label.toLowerCase().indexOf(input.toLowerCase()) >= 0 ||
      option?.props.value.toLowerCase().indexOf(input.toLowerCase()) >= 0,
    [],
  );
  return (
    <MultiSelectContainer ref={_menu as React.RefObject<HTMLDivElement>}>
      <DropdownStyles />
      <Select
        animation="slide-up"
        // TODO: Make Autofocus a variable in the property pane
        // autoFocus
        choiceTransitionName="rc-select-selection__choice-zoom"
        className="rc-select"
        disabled={disabled}
        dropdownClassName="multi-select-dropdown"
        dropdownRender={dropdownRender}
        dropdownStyle={dropdownStyle}
        filterOption={filterOption}
        getPopupContainer={() => getDropdownPosition(_menu.current)}
        inputIcon={inputIcon}
        loading={loading}
        maxTagCount={"responsive"}
        maxTagPlaceholder={(e) => `+${e.length} more`}
        menuItemSelectedIcon={menuItemSelectedIcon}
        mode="multiple"
        notFoundContent="No item Found"
        onChange={onChange}
        options={options}
        placeholder={placeholder || "select option(s)"}
        showArrow
        value={value}
      />
    </MultiSelectContainer>
  );
}

export default MultiSelectComponent;
