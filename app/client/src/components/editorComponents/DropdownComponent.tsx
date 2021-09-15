import React, { Component, ReactNode } from "react";
import styled from "styled-components";
import {
  MenuItem,
  Menu,
  ControlGroup,
  InputGroup,
  IMenuProps,
} from "@blueprintjs/core";
import { BaseButton } from "components/designSystems/appsmith/BaseButton";
import {
  ItemRenderer,
  Select,
  ItemListRenderer,
  IItemListRendererProps,
} from "@blueprintjs/select";
import { DropdownOption } from "components/constants";
import { WrappedFieldInputProps } from "redux-form";

interface ButtonWrapperProps {
  width?: string;
}
interface MenuProps {
  width?: string;
}

type MenuComponentProps = IMenuProps & MenuProps;

const Dropdown = Select.ofType<DropdownOption>();
const StyledDropdown = styled(Dropdown)``;

const StyledButtonWrapper = styled.div<ButtonWrapperProps>`
  width: ${(props) => props.width || "100%"};
`;
const StyledMenu = styled(Menu)<MenuComponentProps>`
  min-width: ${(props) => props.width || "100%"};
  border-radius: 0;
`;
const StyledMenuItem = styled(MenuItem)`
  border-radius: 0;
  &&&.bp3-active {
    background: ${(props) => props.theme.colors.propertyPane.activeButtonText};
  }
`;

const isFormDropdown = (
  props: DropdownComponentProps | FormDropdownComponentProps,
): props is FormDropdownComponentProps => {
  return "input" in props && props.input !== undefined;
};

class DropdownComponent extends Component<
  DropdownComponentProps | FormDropdownComponentProps
> {
  componentDidMount() {
    if (isFormDropdown(this.props)) {
      const { defaultOption, input, options } = this.props;
      const defaultValue = defaultOption
        ? defaultOption.value
        : options[0].value;

      !input.value && input.onChange(defaultValue);
    }
  }

  private newItemTextInput: HTMLInputElement | null = null;
  private setNewItemTextInput = (element: HTMLInputElement | null) => {
    this.newItemTextInput = element;
  };

  public state = {
    isEditing: false,
  };

  showTextBox = (): void => {
    this.setState({
      isEditing: true,
    });
  };

  handleAddItem = (): void => {
    this.props.addItem &&
      this.newItemTextInput &&
      this.props.addItem.addItemHandler(this.newItemTextInput.value);
    this.setState({
      isEditing: false,
    });
  };

  renderItemList: ItemListRenderer<DropdownOption> = (
    props: IItemListRendererProps<DropdownOption>,
  ) => {
    const { items, renderItem } = props;
    const { addItem, width } = this.props;
    const renderItems = items.map(renderItem).filter(Boolean);

    const displayMode = (
      <BaseButton
        buttonStyle="PRIMARY"
        icon-right="plus"
        onClick={this.showTextBox}
        text={addItem?.displayText}
      />
    );
    const editMode = (
      <ControlGroup fill>
        <InputGroup inputRef={this.setNewItemTextInput} />
        <BaseButton onClick={this.handleAddItem} text={addItem?.displayText} />
      </ControlGroup>
    );
    return (
      <StyledMenu ulRef={props.itemsParentRef} width={width}>
        {renderItems}
        {addItem && (!this.state.isEditing ? displayMode : editMode)}
      </StyledMenu>
    );
  };

  searchItem = (query: string, option: DropdownOption): boolean => {
    return (
      option.label.toLowerCase().indexOf(query.toLowerCase()) > -1 ||
      option.value.toLowerCase().indexOf(query.toLowerCase()) > -1 ||
      (!!option.label &&
        option.label.toLowerCase().indexOf(query.toLowerCase()) > -1)
    );
  };
  onItemSelect = (item: DropdownOption): void => {
    if (isFormDropdown(this.props)) {
      this.props.input.onChange(item.value);
    } else {
      this.props.selectHandler(item.value);
    }
  };

  renderItem: ItemRenderer<DropdownOption> = (
    option: DropdownOption,
    { handleClick, modifiers },
  ) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    return (
      <StyledMenuItem
        active={modifiers.active}
        key={option.value}
        label={this.props.hasLabel ? option.label : ""}
        onClick={handleClick}
        shouldDismissPopover={false}
        text={option.label}
      />
    );
  };

  getDropdownOption = (value: string): DropdownOption | undefined => {
    return this.props.options.find((option) => option.value === value);
  };

  getSelectedDisplayText = () => {
    const value = isFormDropdown(this.props)
      ? this.props.input.value
      : this.props.selected.value;
    const item = this.getDropdownOption(value);
    return item ? item.label : "";
  };

  getActiveOption = (): DropdownOption => {
    const { options } = this.props;

    if (isFormDropdown(this.props)) {
      return (
        this.getDropdownOption(this.props.input.value) ||
        this.props.defaultOption ||
        options[0]
      );
    } else {
      return this.props.selected || options[0];
    }
  };

  render() {
    const { autocomplete, color, options, width } = this.props;

    return (
      <StyledDropdown
        activeItem={this.getActiveOption()}
        filterable={!!autocomplete}
        itemListRenderer={this.renderItemList}
        itemPredicate={this.searchItem}
        itemRenderer={this.renderItem}
        items={options}
        itemsEqual="value"
        noResults={<MenuItem disabled text="No results." />}
        onItemSelect={this.onItemSelect}
        popoverProps={{ minimal: true }}
        {...(isFormDropdown(this.props) ? this.props.input : {})}
      >
        {this.props.toggle || (
          <StyledButtonWrapper width={width}>
            <BaseButton
              buttonStyle={color ? "CUSTOM" : "PRIMARY"}
              buttonVariant="SOLID"
              rightIcon="chevron-down"
              text={this.getSelectedDisplayText()}
            />
          </StyledButtonWrapper>
        )}
      </StyledDropdown>
    );
  }
}

export interface BaseDropdownComponentProps {
  addItem?: {
    displayText: string;
    addItemHandler: (name: string) => void;
  };
  autocomplete?: boolean;
  checked?: boolean;
  color?: string;
  hasLabel?: boolean;
  multi?: boolean;
  multiselectDisplayType?: "TAGS" | "CHECKBOXES";
  options: DropdownOption[];
  toggle?: ReactNode;
  width?: string;
}
export interface DropdownComponentProps extends BaseDropdownComponentProps {
  selectHandler: (selectedValue: string) => void;
  selected: DropdownOption;
}

export interface FormDropdownComponentProps extends BaseDropdownComponentProps {
  input: WrappedFieldInputProps;
  defaultOption?: DropdownOption;
}

export default DropdownComponent;
