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

class DropdownComponent extends Component<DropdownComponentProps> {
  componentDidMount() {
    const { input, options } = this.props;
    // set selected option to first option by default
    if (input && !input.value) {
      input.onChange(options[0].value);
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
    const { input, selectHandler } = this.props;
    input && input.onChange(item.value);
    selectHandler && selectHandler(item.value);
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
    const { input, selected } = this.props;

    if (input) {
      const item = this.getDropdownOption(input.value);
      return item && item.label;
    }
    if (selected) {
      const item = this.getDropdownOption(selected.value);
      return item && item.label;
    }
    return "";
  };

  getActiveOption = (): DropdownOption => {
    const { input, options, selected } = this.props;
    const defaultActiveOption = options[0];

    if (input) {
      return this.getDropdownOption(input.value) || defaultActiveOption;
    } else {
      return selected || defaultActiveOption;
    }
  };

  render() {
    const { autocomplete, color, input, options, width } = this.props;

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
        {...input}
      >
        {this.props.toggle || (
          <StyledButtonWrapper width={width}>
            <BaseButton
              buttonColor={color}
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

export interface DropdownComponentProps {
  color?: string;
  hasLabel?: boolean;
  options: DropdownOption[];
  selectHandler?: (selectedValue: string) => void;
  selected?: DropdownOption;
  multiselectDisplayType?: "TAGS" | "CHECKBOXES";
  checked?: boolean;
  multi?: boolean;
  autocomplete?: boolean;
  addItem?: {
    displayText: string;
    addItemHandler: (name: string) => void;
  };
  toggle?: ReactNode;
  input?: WrappedFieldInputProps;
  width?: string;
}

export default DropdownComponent;
