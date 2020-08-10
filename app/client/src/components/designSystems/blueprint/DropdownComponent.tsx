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
  createGlobalStyle,
  labelStyle,
  BlueprintCSSTransform,
  BlueprintInputTransform,
} from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import Fuse from "fuse.js";

const FUSE_OPTIONS = {
  shouldSort: true,
  threshold: 0.5,
  location: 0,
  minMatchCharLength: 3,
  findAllMatches: true,
  keys: ["label", "value"],
};

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

const StyledControlGroup = styled(ControlGroup)<{ haslabel: string }>`
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
        props.haslabel === "true" ? `calc(70% - ${WIDGET_PADDING}px)` : "100%"};
    }
  }
`;

const DropdownStyles = createGlobalStyle`
  .select-popover-wrapper {
    width: 100%;
    border-radius: ${props => props.theme.radii[1]}px;
    box-shadow:  0px 2px 4px rgba(67, 70, 74, 0.14);
    padding: ${props => props.theme.spaces[3]}px;
    background: white;
    && .${Classes.MENU} {
      max-width: 100%;
      max-height: auto;
    }
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
      .${Classes.CONTROL} .${Classes.CONTROL_INDICATOR} {
        background: white;
        box-shadow: none;
        border-width: 2px;
        border-style: solid;
        border-color: ${Colors.GEYSER};
        &::before {
          width: auto;
          height: 1em;
        }&
      }
      .${Classes.CONTROL} input:checked ~ .${Classes.CONTROL_INDICATOR} {
        background: ${props => props.theme.colors.primary};
        color: ${props => props.theme.colors.textOnDarkBG};
        border-color: ${props => props.theme.colors.primary};
      }
    }
  }
`;

const DropdownContainer = styled.div`
  ${BlueprintCSSTransform}
`;

const StyledMultiDropDown = styled(MultiDropDown)<{
  hideCloseButtonIndex: number;
  height: number;
}>`
  div {
    flex: 1 1 auto;
    max-height: ${props => props.height}px;
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

      ${props =>
        props.hideCloseButtonIndex >= 0 &&
        `
      .${Classes.TAG}:nth-child(${props.hideCloseButtonIndex}) {
        .${Classes.ICON} {
          align-self: center;
          margin-right: 0px;
          color: ${Colors.SLATE_GRAY};
        }
        button {
          display: none;
        }
      }
      `}
      
      & > .${Classes.ICON} {
        align-self: center;
        margin-right: 10px;
        color: ${Colors.SLATE_GRAY};
      }
      .${Classes.INPUT_GHOST} {
        flex: 0 0 auto;
        margin: 0;
      }
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
    let selectedItems = [];
    if (this.props.lengthOfOverflowingItems > 0) {
      selectedItems = this.props.selectedIndexArr
        ? _.map(
            this.props.selectedIndexArr.slice(
              0,
              this.props.selectedIndexArr.length -
                (this.props.lengthOfOverflowingItems + 1),
            ),
            index => {
              return this.props.options[index];
            },
          )
        : [];
      selectedItems.push({
        label: `${this.props.lengthOfOverflowingItems + 1} more`,
        value: "",
      });
    } else {
      selectedItems = this.props.selectedIndexArr
        ? _.map(this.props.selectedIndexArr, index => {
            return this.props.options[index];
          })
        : [];
    }
    const hideCloseButtonIndex =
      this.props.lengthOfOverflowingItems > 0 ? selectedItems.length : -1;
    return (
      <DropdownContainer>
        <DropdownStyles />
        <StyledControlGroup
          fill
          haslabel={!!this.props.label ? "true" : "false"}
        >
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
              filterable={true}
              itemRenderer={this.renderSingleSelectItem}
              onItemSelect={this.onItemSelect}
              disabled={this.props.disabled}
              popoverProps={{
                minimal: true,
                usePortal: true,
                popoverClassName: "select-popover-wrapper",
              }}
              itemListPredicate={this.itemListPredicate}
            >
              <Button
                rightIcon={IconNames.CHEVRON_DOWN}
                text={
                  !_.isEmpty(this.props.options) &&
                  this.props.selectedIndex !== undefined &&
                  this.props.selectedIndex > -1
                    ? this.props.options[this.props.selectedIndex].label
                    : "-- Empty --"
                }
              />
            </StyledSingleDropDown>
          ) : (
            <StyledMultiDropDown
              className={this.props.isLoading ? Classes.SKELETON : ""}
              items={this.props.options}
              itemListPredicate={this.itemListPredicate}
              placeholder={this.props.placeholder}
              tagRenderer={this.renderTag}
              itemRenderer={this.renderMultiSelectItem}
              selectedItems={selectedItems}
              height={this.props.height}
              tagInputProps={{
                onRemove: this.onItemRemoved,
                tagProps: (value, index) => ({
                  minimal: true,
                  interactive:
                    hideCloseButtonIndex - 1 === index ? true : false,
                  rightIcon:
                    hideCloseButtonIndex - 1 === index
                      ? IconNames.CHEVRON_DOWN
                      : undefined,
                }),
                disabled: this.props.disabled,
                rightElement: <Icon icon={IconNames.CHEVRON_DOWN} />,
              }}
              hideCloseButtonIndex={hideCloseButtonIndex}
              onItemSelect={this.onItemSelect}
              popoverProps={{
                minimal: true,
                usePortal: true,
                popoverClassName: "select-popover-wrapper",
              }}
            />
          )}
        </StyledControlGroup>
      </DropdownContainer>
    );
  }

  itemListPredicate(query: string, items: DropdownOption[]) {
    const fuse = new Fuse(items, FUSE_OPTIONS);
    return query ? fuse.search(query) : items;
  }

  onItemSelect = (item: DropdownOption): void => {
    this.props.onOptionSelected(item);
  };

  onItemRemoved = (_tag: string, index: number) => {
    this.props.onOptionRemoved(this.props.selectedIndexArr[index]);
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
  width: number;
  height: number;
  lengthOfOverflowingItems: number;
}

export default DropDownComponent;
