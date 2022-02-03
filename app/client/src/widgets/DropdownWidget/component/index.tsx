import React from "react";
import { ComponentProps } from "widgets/BaseComponent";
import { MenuItem, Button, ControlGroup, Classes } from "@blueprintjs/core";
import { DropdownOption } from "../constants";
import { Select, IItemRendererProps } from "@blueprintjs/select";
import _ from "lodash";
import "../../../../node_modules/@blueprintjs/select/lib/css/blueprint-select.css";
import styled, {
  createGlobalStyle,
  BlueprintCSSTransform,
} from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { TextSize } from "constants/WidgetConstants";
import { StyledLabel, TextLabelWrapper } from "./index.styled";
import Fuse from "fuse.js";
import { WidgetContainerDiff } from "widgets/WidgetUtils";
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
const StyledSingleDropDown = styled(SingleDropDown)<{
  isSelected: boolean;
  isValid: boolean;
  hasError?: boolean;
}>`
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
    border: 1.2px solid
      ${(props) => (props.hasError ? Colors.DANGER_SOLID : Colors.GREY_3)};
    ${(props) =>
      props.isValid
        ? `
        &:hover {
          border: 1.2px solid ${Colors.GREY_5};
        }
        &:focus {
          border: 1.2px solid ${Colors.GREEN_SOLID};
          outline: 0;
        }
      `
        : ""};
  }

  &&&&& .${Classes.POPOVER_OPEN} .${Classes.BUTTON} {
    outline: 0;
    ${(props) =>
      !props.hasError
        ? `
        border: 1.2px solid ${Colors.GREEN_SOLID};
        box-shadow: 0px 0px 0px 2px ${Colors.GREEN_SOLID_HOVER};
      `
        : `border: 1.2px solid ${Colors.DANGER_SOLID};`}
  }
  &&&&& .${Classes.DISABLED} {
    background-color: ${Colors.GREY_1};
    border: 1.2px solid ${Colors.GREY_3};
    .${Classes.BUTTON_TEXT} {
      color: ${Colors.GREY_7};
    }
  }
  .${Classes.BUTTON_TEXT} {
    text-overflow: ellipsis;
    text-align: left;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    color: ${(props) => (props.isSelected ? Colors.GREY_10 : Colors.GREY_6)};
  }
  && {
    .${Classes.ICON} {
      width: fit-content;
      color: ${Colors.SLATE_GRAY};
    }
  }
`;

const StyledControlGroup = styled(ControlGroup)`
  &&& > {
    span {
      height: 100%;
      max-width: 100%;

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

const DropdownStyles = createGlobalStyle<{
  parentWidth: number;
  dropDownWidth: number;
  id: string;
}>`
${({ dropDownWidth, id, parentWidth }) => `
  .select-popover-width-${id} {
    min-width: ${parentWidth > dropDownWidth ? parentWidth : dropDownWidth}px;

    & .${Classes.INPUT_GROUP} {
       width: ${parentWidth > dropDownWidth ? parentWidth : dropDownWidth}px;
    }
  }
`}
  .select-popover-wrapper {
    width: auto;
    box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15) !important;
    border-radius: 0;
    background: white;

    & .${Classes.INPUT_GROUP} {
      padding: 12px 12px 8px 12px;
      min-width: 180px;

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
      min-width: 0px !important;
    }
    &&&& .${Classes.MENU_ITEM} {
      min-height: 38px;
      padding: 9px 12px;
      color: ${Colors.GREY_8};
      &:hover{
        background: ${Colors.GREEN_SOLID_LIGHT_HOVER};
      }
      &.is-focused{
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

const DropdownContainer = styled.div<{ compactMode: boolean }>`
  ${BlueprintCSSTransform}
  display: flex;
  flex-direction: ${(props) => (props.compactMode ? "row" : "column")};
  align-items: ${(props) => (props.compactMode ? "center" : "left")};

  label.select-label {
    margin-bottom: ${(props) => (props.compactMode ? "0px" : "5px")};
    margin-right: ${(props) => (props.compactMode ? "10px" : "0px")};
  }
`;
const DEBOUNCE_TIMEOUT = 800;

interface DropDownComponentState {
  activeItemIndex: number | undefined;
}
class DropDownComponent extends React.Component<
  DropDownComponentProps,
  DropDownComponentState
> {
  state = {
    // used to show focused item for keyboard up down key interection
    activeItemIndex: -1,
  };
  componentDidMount = () => {
    // set default selectedIndex as focused index
    this.setState({ activeItemIndex: this.props.selectedIndex });
  };

  componentDidUpdate = (prevProps: DropDownComponentProps) => {
    if (prevProps.selectedIndex !== this.props.selectedIndex) {
      // update focus index if selectedIndex changed by property pane
      this.setState({ activeItemIndex: this.props.selectedIndex });
    }
  };

  handleActiveItemChange = (activeItem: DropdownOption | null) => {
    // find new index from options
    const activeItemIndex = _.findIndex(this.props.options, [
      "label",
      activeItem?.label,
    ]);
    this.setState({ activeItemIndex });
  };
  render() {
    const id = _.uniqueId();
    const {
      compactMode,
      disabled,
      isLoading,
      labelStyle,
      labelText,
      labelTextColor,
      labelTextSize,
    } = this.props;
    // active focused item
    const activeItem = !_.isEmpty(this.props.options)
      ? this.props.options[this.state.activeItemIndex]
      : undefined;
    // get selected option label from selectedIndex
    const selectedOption =
      !_.isEmpty(this.props.options) &&
      this.props.selectedIndex !== undefined &&
      this.props.selectedIndex > -1
        ? this.props.options[this.props.selectedIndex].label
        : undefined;
    // for display selected option, there is no separate option to show placeholder
    const value = selectedOption
      ? selectedOption
      : this.props.placeholder || "-- Select --";
    return (
      <DropdownContainer compactMode={compactMode}>
        <DropdownStyles
          dropDownWidth={this.props.dropDownWidth}
          id={id}
          parentWidth={this.props.width - WidgetContainerDiff}
        />
        {labelText && (
          <TextLabelWrapper compactMode={compactMode}>
            <StyledLabel
              $compactMode={compactMode}
              $disabled={!!disabled}
              $labelStyle={labelStyle}
              $labelText={labelText}
              $labelTextColor={labelTextColor}
              $labelTextSize={labelTextSize}
              className={`select-label ${
                isLoading ? Classes.SKELETON : Classes.TEXT_OVERFLOW_ELLIPSIS
              }`}
            >
              {labelText}
            </StyledLabel>
          </TextLabelWrapper>
        )}
        <StyledControlGroup fill>
          <StyledSingleDropDown
            activeItem={activeItem}
            className={isLoading ? Classes.SKELETON : ""}
            disabled={disabled}
            filterable={this.props.isFilterable}
            hasError={this.props.hasError}
            isSelected={
              !_.isEmpty(this.props.options) &&
              this.props.selectedIndex !== undefined &&
              this.props.selectedIndex > -1
            }
            isValid={this.props.isValid}
            itemListPredicate={
              !this.props.serverSideFiltering
                ? this.itemListPredicate
                : undefined
            }
            itemRenderer={this.renderSingleSelectItem}
            items={this.props.options}
            noResults={<MenuItem disabled text="No Results Found" />}
            onActiveItemChange={this.handleActiveItemChange}
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
              popoverClassName: `select-popover-wrapper select-popover-width-${id}`,
            }}
          >
            <Button
              disabled={this.props.disabled}
              rightIcon={
                <Icon
                  className="dropdown-icon"
                  fillColor={
                    this.props.disabled ? Colors.GREY_7 : Colors.GREY_10
                  }
                  name="dropdown"
                />
              }
              text={value}
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
  labelText?: string;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  compactMode: boolean;
  selectedIndex?: number;
  options: DropdownOption[];
  isLoading: boolean;
  isFilterable: boolean;
  isValid: boolean;
  width: number;
  dropDownWidth: number;
  height: number;
  serverSideFiltering: boolean;
  hasError?: boolean;
  onFilterChange: (text: string) => void;
}

export default DropDownComponent;
