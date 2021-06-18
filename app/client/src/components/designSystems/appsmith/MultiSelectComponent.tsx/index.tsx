import React, { useContext, useEffect, useState } from "react";
import Select, { SelectProps } from "rc-select";
import { Checkbox, Classes } from "@blueprintjs/core";
import "./index.css";
import styled from "styled-components";
import { LayersContext } from "constants/Layers";
import { Colors } from "constants/Colors";
import { createGlobalStyle } from "constants/DefaultTheme";
import { DefaultValueType } from "rc-select/lib/interface/generator";

const DropdownStyles = createGlobalStyle`
  .multi-select-dropdown {
    .${Classes.ALIGN_LEFT} {
        font-size: 16px;
      .${Classes.CONTROL_INDICATOR} {
        margin-right: 20px;
      }
    }
      &&&& .${Classes.CONTROL} .${Classes.CONTROL_INDICATOR} {
      background: white;
      box-shadow: none;
      border-width: 2px;
      border-style: solid;
      border-color: ${Colors.GEYSER};
      &::before {
        width: auto;
        height: 1em;
      }
    }
    .${Classes.CONTROL} input:checked ~ .${Classes.CONTROL_INDICATOR} {
      background: ${(props) => props.theme.colors.primaryOld};
      color: ${(props) => props.theme.colors.textOnDarkBG};
      border-color: ${(props) => props.theme.colors.primaryOld};
    }
  }
`;

const MultiSelectContainer = styled.div``;
const StyledCheckbox = styled(Checkbox)`
  &&.${Classes.CHECKBOX}.${Classes.CONTROL} {
    margin: 0;
  }
`;

const menuItemSelectedIcon = (props: { isSelected: boolean }) => {
  return <StyledCheckbox checked={props.isSelected} />;
};

export interface MultiSelectProps
  extends Required<
    Pick<SelectProps, "disabled" | "options" | "placeholder" | "loading">
  > {
  mode?: "multiple" | "tags";
  value: string[];
  onChange: (value: DefaultValueType) => void;
}

function MultiSelectComponent({
  disabled,
  loading,
  onChange,
  options,
  placeholder,
  value,
}: MultiSelectProps): JSX.Element {
  const layer = useContext(LayersContext);
  const [isSelectAll, setIsSelectAll] = useState(false);

  const handleSelectAll = () => {
    if (!isSelectAll) {
      const allOption: string[] = options.map((option) => option.value);
      onChange(allOption);
      setIsSelectAll(true);
      return;
    }
    setIsSelectAll(false);
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

  return (
    <MultiSelectContainer>
      <DropdownStyles />
      <Select
        animation="slide-up"
        autoFocus
        choiceTransitionName="rc-select-selection__choice-zoom"
        className="rc-select"
        disabled={disabled}
        dropdownClassName="multi-select-dropdown"
        dropdownRender={(menu) => (
          <>
            <StyledCheckbox
              alignIndicator="left"
              checked={isSelectAll}
              label="Select all"
              onChange={handleSelectAll}
              style={{
                paddingBottom: "10px",
                marginLeft: "16px",
              }}
            />
            {menu}
          </>
        )}
        dropdownStyle={{
          zIndex: layer.portals,
        }}
        getPopupContainer={() =>
          document.getElementsByClassName("appsmith_widget_0")[0] as HTMLElement
        }
        inputIcon={
          <svg
            data-icon="chevron-down"
            height="16"
            viewBox="0 0 16 16"
            width="16"
          >
            <desc>chevron-down</desc>
            <path
              d="M12 5c-.28 0-.53.11-.71.29L8 8.59l-3.29-3.3a1.003 1.003 0 00-1.42 1.42l4 4c.18.18.43.29.71.29s.53-.11.71-.29l4-4A1.003 1.003 0 0012 5z"
              fillRule="evenodd"
            />
          </svg>
        }
        loading={loading}
        maxTagCount={"responsive"}
        maxTagPlaceholder={(e) => `+${e.length} more`}
        menuItemSelectedIcon={menuItemSelectedIcon}
        mode="multiple"
        notFoundContent="No item Found"
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        showArrow
        value={value}
      />
    </MultiSelectContainer>
  );
}

export default MultiSelectComponent;
