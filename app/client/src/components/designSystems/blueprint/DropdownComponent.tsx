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
    min-height: 32px;
    border: ${(props) => getBorderCSSShorthand(props.theme.borders[2])};
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

const StyledCheckbox = styled(Checkbox)`
  &&.${Classes.CHECKBOX}.${Classes.CONTROL} {
    margin: 0;
  }
`;

const StyledMultiDropDown = styled(MultiDropDown)<{
  hideCloseButtonIndex: number;
  height: number;
  width: number;
}>`
  div {
    flex: 1 1 auto;
    height: ${(props) => props.height - WIDGET_PADDING * 2}px;
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
        min-height: 32px;

      .${Classes.TAG_INPUT_VALUES} {
        margin-top: 0;
        overflow: hidden;
        display: flex;
        height: ${(props) => props.height - WIDGET_PADDING * 2 - 2}px;
        align-content: flex-start;
      }

      .${Classes.TAG} {
        background: none;
        border: 1px solid #D0D7DD;
        border-radius: 2px;
        margin: 3px 2px;
        max-width: ${(props) => props.width * 0.85}px;
        height: 24px;
      }

      ${(props) =>
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
        display: flex;
        height: 26px;
        flex: 1;
      }
    }
  }
`;
interface DropDownComponentState {
  portalContainer: HTMLElement;
}

class DropDownComponent extends React.Component<
  DropDownComponentProps,
  DropDownComponentState
> {
  private _menu = React.createRef<HTMLDivElement>();
  constructor(props: DropDownComponentProps) {
    super(props);
    this.state = { portalContainer: this._menu.current as HTMLElement };
  }
  componentDidMount() {
    this.setState({
      portalContainer: this.props.getDropdownPosition(this._menu.current),
    });
  }

  render() {
    const { options, selectedIndexArr } = this.props;
    const { portalContainer } = this.state;
    const selectedItems = selectedIndexArr
      ? _.map(selectedIndexArr, (index) => options[index])
      : [];
    const hideCloseButtonIndex = -1;

    return (
      <DropdownContainer ref={this._menu as React.RefObject<HTMLDivElement>}>
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
              disabled={this.props.disabled}
              filterable={this.props.isFilterable}
              itemListPredicate={this.itemListPredicate}
              itemRenderer={this.renderSingleSelectItem}
              items={this.props.options}
              onItemSelect={this.onItemSelect}
              popoverProps={{
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
                rightIcon={IconNames.CHEVRON_DOWN}
                text={
                  !_.isEmpty(this.props.options) &&
                  this.props.selectedIndex !== undefined &&
                  this.props.selectedIndex > -1
                    ? this.props.options[this.props.selectedIndex].label
                    : "-- Select --"
                }
              />
            </StyledSingleDropDown>
          ) : (
            <StyledMultiDropDown
              className={this.props.isLoading ? Classes.SKELETON : ""}
              height={this.props.height}
              hideCloseButtonIndex={hideCloseButtonIndex}
              itemListPredicate={this.itemListPredicate}
              itemRenderer={this.renderMultiSelectItem}
              items={this.props.options}
              onItemSelect={this.onItemSelect}
              placeholder={this.props.placeholder}
              popoverProps={{
                minimal: true,
                usePortal: true,
                portalContainer,
                modifiers: {
                  preventOverflow: {
                    enabled: false,
                  },
                },
                popoverClassName: "select-popover-wrapper",
              }}
              resetOnSelect
              scrollToActiveItem={false}
              selectedItems={selectedItems}
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
                fill: true,
                rightElement: <Icon icon={IconNames.CHEVRON_DOWN} />,
              }}
              tagRenderer={this.renderTag}
              width={this.props.width}
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

  onItemRemoved = (_tag: ReactNode, index: number) => {
    this.props.onOptionRemoved(this.props.selectedIndexArr[index]);
  };

  renderTag = (option: DropdownOption) => {
    return option?.label;
  };

  isOptionSelected = (selectedOption: DropdownOption) => {
    const optionIndex = _.findIndex(this.props.options, (option) => {
      return option.value === selectedOption.value;
    });
    if (this.props.selectionType === "SINGLE_SELECT") {
      return optionIndex === this.props.selectedIndex;
    } else {
      return (
        _.findIndex(this.props.selectedIndexArr, (index) => {
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
        active={isSelected}
        className="single-select"
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
      <StyledCheckbox
        alignIndicator="left"
        checked={isSelected}
        label={option.label}
        onChange={(e: any) => itemProps.handleClick(e)}
      />
    );
    return (
      <MenuItem
        active={isSelected}
        className="multi-select"
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
  isFilterable: boolean;
  width: number;
  height: number;
  getDropdownPosition: (node: HTMLDivElement | null) => HTMLElement;
}

export default DropDownComponent;
