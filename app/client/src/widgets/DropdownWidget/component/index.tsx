import React from "react";
import { ComponentProps } from "widgets/BaseComponent";
import {
  MenuItem,
  Button,
  ControlGroup,
  Label,
  Classes,
} from "@blueprintjs/core";
import { DropdownOption } from "../constants";
import { Select, IItemRendererProps } from "@blueprintjs/select";
import _ from "lodash";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import "../../../../node_modules/@blueprintjs/select/lib/css/blueprint-select.css";
import styled, {
  createGlobalStyle,
  labelStyle,
  BlueprintCSSTransform,
} from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import Fuse from "fuse.js";
import Icon from "components/ads/Icon";

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

    & > div {
      height: 100%;
    }
  }
  &&&& .${Classes.BUTTON} {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: space-between;
    box-shadow: none;
    background: white;
    min-height: 36px;
    padding-left: 12px;
    border: 1.2px solid ${Colors.GREY_3};
    &:hover {
      border: 1.2px solid ${Colors.GREY_5};
    }
    &:focus {
      border: 1.2px solid ${Colors.GREEN_SOLID};
      outline: 0;
    }
  }

  &&&&& .${Classes.POPOVER_OPEN} .${Classes.BUTTON} {
    border: 1.2px solid ${Colors.GREEN_SOLID};
    box-shadow: 0px 0px 0px 2px ${Colors.GREEN_SOLID_HOVER};
    outline: 0;
  }
  &&&&& .${Classes.DISABLED} {
    background-color: ${Colors.GREY_1};
    border: 1.2px solid ${Colors.GREY_3};
  }
  .${Classes.BUTTON_TEXT} {
    text-overflow: ellipsis;
    text-align: left;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    color: ${Colors.GREY_10};
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
      height: 100%;
      max-width: ${(props) =>
        props.haslabel === "true" ? `calc(70% - ${WIDGET_PADDING}px)` : "100%"};

      & > span {
        height: 100%;
      }

      .dropdown-icon {
        width: 20px;

        svg {
          width: 20px;
          height: 20px;
        }
      }
    }
  }
`;

const DropdownStyles = createGlobalStyle<{ width: number }>`
  .select-popover-wrapper {
    width: ${(props) => props.width - props.theme.spaces[3]}px;
    box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
    border-radius: 0;
    background: white;

    & .${Classes.INPUT_GROUP} {
      padding: 12px 12px 8px 12px;

      & > .${Classes.ICON} {
        &:first-child {
          left: 12px;
          top: 14px;
          margin: 9px;
          color: ${Colors.GREY_7};

          & > svg {
            width: 14px;
            height: 14px;
          }
        }
      }
      & > .${Classes.INPUT_ACTION} {
        &:last-child {
          right: 13px;
          top: 13px;

          .${Classes.BUTTON} {
            min-height: 34px;
            min-width: 35px;
            margin: 0px;
            color: ${Colors.GREY_6} !important;

            &:hover {
              color: ${Colors.GREY_10} !important;
              background: ${Colors.GREY_2};
              border-radius: 0;
            }
          }
        }
      }
      .${Classes.INPUT} {
        height: 36px;
        border: 1.2px solid ${Colors.GREY_3};
        color: ${Colors.GREY_10};
        &:focus {
          border: 1.2px solid ${Colors.GREEN_SOLID};
          box-shadow: 0px 0px 0px 2px ${Colors.GREEN_SOLID_HOVER};
        }
      }
    }
    && .${Classes.MENU} {
      margin-top: -3px;
      max-width: 100%;
      max-height: auto;
    }
    &&&& .${Classes.MENU_ITEM} {
      min-height: 38px;
      padding: 9px 12px;
      color: ${Colors.GREY_8};
      &:hover{
        background: ${Colors.GREEN_SOLID_LIGHT_HOVER};
      }
      &.${Classes.ACTIVE} {
        background: ${Colors.GREEN_SOLID_LIGHT_HOVER};
        color: ${Colors.GREY_10};
        position:relative;
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
        <DropdownStyles width={this.props.width} />
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
              rightIcon={
                <Icon
                  className="dropdown-icon"
                  fillColor={Colors.GREY_10}
                  name="dropdown"
                />
              }
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
