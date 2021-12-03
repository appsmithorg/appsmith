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
import { ButtonVariantTypes, DropdownOption } from "components/constants";
import { WrappedFieldInputProps } from "redux-form";

interface ButtonWrapperProps {
  height?: string;
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
  height: ${(props) => props.height || "100%"};
  button.bp3-button {
    border: 1px solid ${(props) => props.theme.colors.border} !important;
    background: #fff !important;
    & > span {
      color: ${(props) => props.theme.colors.dropdown.header.text} !important;
    }
    font-weight: ${(props) => props.theme.fontWeights[1]};
  }
`;
const StyledMenu = styled(Menu)<MenuComponentProps>`
  min-width: ${(props) => props.width || "100%"};
  border-radius: 0;
`;
const StyledMenuItem = styled(MenuItem)`
  border-radius: 0;
  color: ${(props) => props.theme.colors.dropdown.header.text};
  &&&:hover {
    color: ${(props) => props.theme.colors.dropdown.menu.hoverText};
    background: ${(props) => props.theme.colors.dropdown.menu.hover};
  }
  &&&.bp3-active {
    color: ${(props) => props.theme.colors.dropdown.selected.text};
    background: ${(props) => props.theme.colors.dropdown.selected.bg};
  }
`;

// function checks if dropdown is connected to a redux form (of interface 'FormDropdownComponentProps')
const isFormDropdown = (
  props: DropdownComponentProps | FormDropdownComponentProps,
): props is FormDropdownComponentProps => {
  return "input" in props && props.input !== undefined;
};

class DropdownComponent extends Component<
  DropdownComponentProps | FormDropdownComponentProps
> {
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
  // function is called after user selects an option
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

  // helper function that returns a dropdown option given its value
  // returns undefined if option isn't found
  getDropdownOption = (
    value: string | undefined,
  ): DropdownOption | undefined => {
    return this.props.options.find((option) => option.value === value);
  };

  // this function returns the selected item's label
  // returns the "placeholder" in the event that no option is selected.
  getSelectedDisplayText = () => {
    const value = isFormDropdown(this.props)
      ? this.props.input.value
      : this.props.selected?.value;

    const item = this.getDropdownOption(value);
    return item ? item.label : this.props.placeholder;
  };

  // this function returns the active option
  // returns undefined if no option is selected
  getActiveOption = (): DropdownOption | undefined => {
    if (isFormDropdown(this.props)) {
      return this.getDropdownOption(this.props.input.value);
    } else {
      return this.props.selected;
    }
  };

  render() {
    const { autocomplete, height, options, width } = this.props;

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
        // Destructure the "input" prop if dropdown is form-connected
        {...(isFormDropdown(this.props) ? this.props.input : {})}
      >
        {this.props.toggle || (
          <StyledButtonWrapper height={height} width={width}>
            <BaseButton
              buttonStyle="PRIMARY"
              buttonVariant={ButtonVariantTypes.SECONDARY}
              rightIcon="chevron-down"
              text={this.getSelectedDisplayText()}
            />
          </StyledButtonWrapper>
        )}
      </StyledDropdown>
    );
  }
}

// Dropdown can either be connected to a redux-form
// or be a stand-alone component

// Props common to both classes of dropdowns
export interface BaseDropdownComponentProps {
  addItem?: {
    displayText: string;
    addItemHandler: (name: string) => void;
  };
  autocomplete?: boolean;
  checked?: boolean;
  hasLabel?: boolean;
  height?: string;
  multi?: boolean;
  multiselectDisplayType?: "TAGS" | "CHECKBOXES";
  options: DropdownOption[];
  placeholder: string;
  toggle?: ReactNode;
  width?: string;
}

// stand-alone dropdown interface
export interface DropdownComponentProps extends BaseDropdownComponentProps {
  selectHandler: (selectedValue: string) => void;
  selected: DropdownOption | undefined;
}

// Form-connected dropdown interface
export interface FormDropdownComponentProps extends BaseDropdownComponentProps {
  input: WrappedFieldInputProps;
}

export default DropdownComponent;
