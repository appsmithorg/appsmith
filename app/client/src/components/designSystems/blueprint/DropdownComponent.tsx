import React, { ReactNode } from "react";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import {
  MenuItem,
  Button,
  ControlGroup,
  Label,
  Classes,
  Checkbox,
  Icon,
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { SelectionType, DropdownOption } from "widgets/DropdownWidget";
import {
  Select,
  MultiSelect,
  IItemRendererProps,
  Classes as MultiSelectClasses,
} from "@blueprintjs/select";
import _ from "lodash";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import "../../../../node_modules/@blueprintjs/select/lib/css/blueprint-select.css";
import styled, {
  labelStyle,
  BlueprintCSSTransform,
  BlueprintInputTransform,
} from "constants/DefaultTheme";
import { Colors } from "constants/Colors";

const SingleDropDown = Select.ofType<DropdownOption>();
const MultiDropDown = MultiSelect.ofType<DropdownOption>();

const StyledSingleDropDown = styled(SingleDropDown)`
  div {
    flex: 1 1 auto;
  }
  span {
    width: 100%;
    position: relative;
  }
  .${Classes.BUTTON} {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    box-shadow: none;
    background: white;
  }
  .${Classes.BUTTON_TEXT} {
    text-overflow: ellipsis;
    text-align: left;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
  && {
    .${Classes.ICON} {
      width: fit-content;
      color: ${Colors.SLATE_GRAY};
    }
  }
`;

const StyledControlGroup = styled(ControlGroup)<{ hasLabel: boolean }>`
  &&& > {
    label {
      ${labelStyle}
      margin: 7px ${WIDGET_PADDING * 2}px 0 0;
      align-self: flex-start;
      flex: 0 1 30%;
      max-width: calc(30% - ${WIDGET_PADDING}px);
      text-align: right;
    }
    span {
      max-width: ${props =>
        props.hasLabel ? `calc(70% - ${WIDGET_PADDING}px)` : "100%"};
    }
  }
`;

const DropdownContainer = styled.div`
  ${BlueprintCSSTransform}
  &&&& .${Classes.MENU_ITEM} {
    border-radius: ${props => props.theme.radii[1]}px;
    &:hover{
      background: ${Colors.POLAR};
    }
  &.${Classes.ACTIVE} {
    background: ${Colors.POLAR};
    color: ${props => props.theme.colors.textDefault};
    position:relative;
    &.single-select{
      &:before{
        left: 0;
        top: -2px;
        position: absolute;
        content: "";
        background: ${props => props.theme.colors.primary};
        border-radius: 4px 0 0 4px;
        width: 4px;
        height:100%;
      }
    }
  }
}
  && .${Classes.POPOVER} {
    width: 100%;
    border-radius: ${props => props.theme.radii[1]}px;
    box-shadow:  0px 2px 4px rgba(67, 70, 74, 0.14);
    padding: ${props => props.theme.spaces[3]}px;
    background: white;
  }

  && .${Classes.POPOVER_WRAPPER} {
    position:relative;
    .${Classes.OVERLAY} {
      position: absolute;
      .${Classes.TRANSITION_CONTAINER} {
        width: 100%;
      }
    }
  }
  && .${Classes.MENU} {
    max-width: 100%;
    max-height: auto;
  }
  width: 100%;
`;

const StyledMultiDropDown = styled(MultiDropDown)`
  div {
    flex: 1 1 auto;
  }
  .${MultiSelectClasses.MULTISELECT} {
    position: relative;
    min-width: 0;
  }
  && {
    ${BlueprintInputTransform}
    .${Classes.TAG_INPUT} {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        text-overflow: ellipsis;
        overflow: hidden;

      .${Classes.TAG_INPUT_VALUES} {
        margin-top: 0;
        overflow: hidden;
        padding: 2px 0;
      }
      .${Classes.TAG} {
        background: none;
        border: 1px solid #D0D7DD;
        border-radius: 2px;
        margin-bottom: 0;
        max-width: 100px;
      }
      & > .${Classes.ICON} {
        align-self: center;
        margin-right: 10px;
        color: ${Colors.SLATE_GRAY};
      }
      .${Classes.INPUT_GHOST} {
        width: 0px;
        flex: 0 0 auto;
      }
    }
  }
  &&&& {
    .${Classes.CONTROL} .${Classes.CONTROL_INDICATOR} {
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
      background: ${props => props.theme.colors.primary};
      color: ${props => props.theme.colors.textOnDarkBG};
      border-color: ${props => props.theme.colors.primary};
    }
  }
`;

const StyledCheckbox = styled(Checkbox)`
  &&.${Classes.CHECKBOX}.${Classes.CONTROL} {
    margin: 0;
  }
`;

class DropDownComponent extends React.Component<DropDownComponentProps> {
  render() {
    const selectedItems = this.props.selectedIndexArr
      ? _.map(this.props.selectedIndexArr, index => {
          return this.props.options[index];
        })
      : [];
    return (
      <DropdownContainer>
        <StyledControlGroup fill hasLabel={!!this.props.label}>
          {this.props.label && (
            <Label
              className={
                this.props.isLoading
                  ? Classes.SKELETON
                  : Classes.TEXT_OVERFLOW_ELLIPSIS
              }
            >
              {this.props.label}
            </Label>
          )}
          {this.props.selectionType === "SINGLE_SELECT" ? (
            <StyledSingleDropDown
              className={this.props.isLoading ? Classes.SKELETON : ""}
              items={this.props.options}
              filterable={false}
              itemRenderer={this.renderSingleSelectItem}
              onItemSelect={this.onItemSelect}
              popoverProps={{
                minimal: true,
                usePortal: false,
              }}
            >
              <Button
                rightIcon={IconNames.CHEVRON_DOWN}
                text={
                  !_.isEmpty(this.props.options) &&
                  this.props.selectedIndex !== undefined
                    ? this.props.options[this.props.selectedIndex].label
                    : "-- Empty --"
                }
              />
            </StyledSingleDropDown>
          ) : (
            <StyledMultiDropDown
              className={this.props.isLoading ? Classes.SKELETON : ""}
              items={this.props.options}
              placeholder={this.props.placeholder}
              tagRenderer={this.renderTag}
              itemRenderer={this.renderMultiSelectItem}
              selectedItems={selectedItems}
              tagInputProps={{
                onRemove: this.onItemRemoved,
                tagProps: { minimal: true },
                inputProps: { readOnly: true },
                rightElement: <Icon icon={IconNames.CHEVRON_DOWN} />,
              }}
              onItemSelect={this.onItemSelect}
              popoverProps={{
                minimal: true,
                usePortal: false,
              }}
            ></StyledMultiDropDown>
          )}
        </StyledControlGroup>
      </DropdownContainer>
    );
  }

  onItemSelect = (item: DropdownOption): void => {
    this.props.onOptionSelected(item);
  };

  onItemRemoved = (_tag: string, index: number) => {
    this.props.onOptionRemoved(index);
  };

  renderTag = (option: DropdownOption) => {
    return option.label;
  };

  isOptionSelected = (selectedOption: DropdownOption) => {
    const optionIndex = _.findIndex(this.props.options, option => {
      return option.value === selectedOption.value;
    });
    if (this.props.selectionType === "SINGLE_SELECT") {
      return optionIndex === this.props.selectedIndex;
    } else {
      return (
        _.findIndex(this.props.selectedIndexArr, index => {
          return index === optionIndex;
        }) !== -1
      );
    }
  };

  renderSingleSelectItem = (
    option: DropdownOption,
    itemProps: IItemRendererProps,
  ) => {
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    const isSelected: boolean = this.isOptionSelected(option);
    return (
      <MenuItem
        className="single-select"
        active={isSelected}
        key={option.value}
        onClick={itemProps.handleClick}
        text={option.label}
      />
    );
  };

  renderMultiSelectItem = (
    option: DropdownOption,
    itemProps: IItemRendererProps,
  ) => {
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    const isSelected: boolean = this.isOptionSelected(option);
    const content: ReactNode = (
      <React.Fragment>
        <StyledCheckbox
          checked={isSelected}
          label={option.label}
          alignIndicator="left"
          onChange={(e: any) => itemProps.handleClick(e)}
        />
      </React.Fragment>
    );
    return (
      <MenuItem
        className="multi-select"
        active={isSelected}
        key={option.value}
        text={content}
      />
    );
  };
}

export interface DropDownComponentProps extends ComponentProps {
  selectionType: SelectionType;
  disabled?: boolean;
  onOptionSelected: (optionSelected: DropdownOption) => void;
  onOptionRemoved: (removedIndex: number) => void;
  placeholder?: string;
  label?: string;
  selectedIndex?: number;
  selectedIndexArr: number[];
  options: DropdownOption[];
  isLoading: boolean;
}

export default DropDownComponent;
