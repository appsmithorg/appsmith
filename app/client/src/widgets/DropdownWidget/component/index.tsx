import React from "react";
import { ComponentProps } from "widgets/BaseComponent";
import {
  MenuItem,
  Button,
  ControlGroup,
  Label,
  Classes,
} from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { DropdownOption } from "../constants";
import { Select, IItemRendererProps } from "@blueprintjs/select";
import _ from "lodash";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import "../../../../node_modules/@blueprintjs/select/lib/css/blueprint-select.css";
import styled, {
  createGlobalStyle,
  labelStyle,
  BlueprintCSSTransform,
  getBorderCSSShorthand,
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
const StyledSingleDropDown = styled(SingleDropDown)<{ isSelected: boolean }>`
  div {
    flex: 1 1 auto;
  }
  span {
    width: 100%;
    position: relative;
  }
  &&&& .${Classes.BUTTON} {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    box-shadow: none;
    background: white;
    min-height: 32px;
    border: ${(props) => getBorderCSSShorthand(props.theme.borders[2])};
    &:focus {
      border: ${(props) => getBorderCSSShorthand(props.theme.borders[2])};
      border-color: #80bdff;
      outline: 0;
      box-shadow: 0 0 0 0.1rem rgba(0, 123, 255, 0.25);
    }
  }

  &&&&& .${Classes.POPOVER_OPEN} .${Classes.BUTTON} {
    border-color: #80bdff;
    outline: 0;
    box-shadow: 0 0 0 0.1rem rgba(0, 123, 255, 0.25);
  }
  &&&&& .${Classes.DISABLED} {
    background-color: ${Colors.SELECT_DISABLED};
  }
  .${Classes.BUTTON_TEXT} {
    text-overflow: ellipsis;
    text-align: left;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    color: ${(props) =>
      props.isSelected ? Colors.SELECT_COLOR : Colors.SELECT_PLACEHOLDER};
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
      max-width: ${(props) =>
        props.haslabel === "true" ? `calc(70% - ${WIDGET_PADDING}px)` : "100%"};
    }
  }
`;

const DropdownStyles = createGlobalStyle`
  .select-popover-wrapper {
    width: 100%;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.2) !important;
    border: ${(props) => getBorderCSSShorthand(props.theme.borders[2])};
    border-color: rgba(0, 0, 0, 0.2);
    border-radius: 0;
    margin-top: ${(props) => props.theme.spaces[3]}px;
    padding: ${(props) => props.theme.spaces[3]}px;
    background: white;
    && .${Classes.MENU} {
      max-width: 100%;
      max-height: auto;
    }
    &&&& .${Classes.MENU_ITEM} {
      border-radius: ${(props) => props.theme.radii[1]}px;
      &:hover{
        background: ${Colors.POLAR};
      }
      &.is-focused{
        background: ${Colors.POLAR};
      }
      &.${Classes.ACTIVE} {
        background: ${Colors.POLAR};
        color: ${(props) => props.theme.colors.textDefault};
        position:relative;
        &.single-select{
          &:before{
            left: 0;
            top: -2px;
            position: absolute;
            content: "";
            background: ${(props) => props.theme.colors.primaryOld};
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
        }
      }
      .${Classes.CONTROL} input:checked ~ .${Classes.CONTROL_INDICATOR} {
        background: ${(props) => props.theme.colors.primaryOld};
        color: ${(props) => props.theme.colors.textOnDarkBG};
        border-color: ${(props) => props.theme.colors.primaryOld};
      }
    }
  }
`;

const DropdownContainer = styled.div`
  ${BlueprintCSSTransform}
`;
const DEBOUNCE_TIMEOUT = 800;

class DropDownComponent extends React.Component<DropDownComponentProps> {
  render() {
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
          <StyledSingleDropDown
            className={this.props.isLoading ? Classes.SKELETON : ""}
            disabled={this.props.disabled}
            filterable={this.props.isFilterable}
            isSelected={
              !_.isEmpty(this.props.options) &&
              this.props.selectedIndex !== undefined &&
              this.props.selectedIndex > -1
            }
            itemListPredicate={
              !this.props.serverSideFiltering
                ? this.itemListPredicate
                : undefined
            }
            itemRenderer={this.renderSingleSelectItem}
            items={this.props.options}
            onItemSelect={this.onItemSelect}
            onQueryChange={
              this.props.serverSideFiltering ? this.serverSideSearch : undefined
            }
            popoverProps={{
              boundary: "window",
              minimal: true,
              usePortal: true,
              modifiers: {
                preventOverflow: {
                  enabled: false,
                },
              },
              popoverClassName: "select-popover-wrapper",
            }}
          >
            <Button
              disabled={this.props.disabled}
              rightIcon={IconNames.CHEVRON_DOWN}
              text={
                !_.isEmpty(this.props.options) &&
                this.props.selectedIndex !== undefined &&
                this.props.selectedIndex > -1
                  ? this.props.options[this.props.selectedIndex].label
                  : this.props.placeholder || "-- Select --"
              }
            />
          </StyledSingleDropDown>
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

  isOptionSelected = (selectedOption: DropdownOption) => {
    const optionIndex = _.findIndex(this.props.options, (option) => {
      return option.value === selectedOption.value;
    });
    return optionIndex === this.props.selectedIndex;
  };
  serverSideSearch = _.debounce((filterValue: string) => {
    this.props.onFilterChange(filterValue);
  }, DEBOUNCE_TIMEOUT);

  renderSingleSelectItem = (
    option: DropdownOption,
    itemProps: IItemRendererProps,
  ) => {
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    const isSelected: boolean = this.isOptionSelected(option);
    // For tabbable menuItems
    const isFocused = itemProps.modifiers.active;
    return (
      <MenuItem
        active={isSelected}
        className={`single-select ${isFocused && "is-focused"}`}
        key={option.value}
        onClick={itemProps.handleClick}
        tabIndex={0}
        text={option.label}
      />
    );
  };
}

export interface DropDownComponentProps extends ComponentProps {
  disabled?: boolean;
  onOptionSelected: (optionSelected: DropdownOption) => void;
  placeholder?: string;
  label?: string;
  selectedIndex?: number;
  options: DropdownOption[];
  isLoading: boolean;
  isFilterable: boolean;
  width: number;
  height: number;
  serverSideFiltering: boolean;
  onFilterChange: (text: string) => void;
}

export default DropDownComponent;
