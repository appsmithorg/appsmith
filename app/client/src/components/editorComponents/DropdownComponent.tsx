import React, { Component, ReactNode } from "react";
import styled from "styled-components";
import { MenuItem, Menu, ControlGroup, InputGroup } from "@blueprintjs/core";
import { BaseButton } from "components/designSystems/blueprint/ButtonComponent";
import {
  ItemRenderer,
  Select,
  ItemListRenderer,
  IItemListRendererProps,
} from "@blueprintjs/select";
import { DropdownOption } from "widgets/DropdownWidget";

const Dropdown = Select.ofType<DropdownOption>();
const StyledDropdown = styled(Dropdown)``;

class DropdownComponent extends Component<DropdownComponentProps> {
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
    if (this.props.addItem) {
      const renderItems = props.items.map(props.renderItem).filter(Boolean);
      const displayMode = (
        <BaseButton
          buttonStyle="PRIMARY"
          icon-right="plus"
          onClick={this.showTextBox}
          text={this.props.addItem.displayText}
        />
      );
      const editMode = (
        <ControlGroup fill>
          <InputGroup inputRef={this.setNewItemTextInput} />
          <BaseButton
            onClick={this.handleAddItem}
            text={this.props.addItem.displayText}
          />
        </ControlGroup>
      );
      return (
        <Menu ulRef={props.itemsParentRef}>
          {renderItems}
          {!this.state.isEditing ? displayMode : editMode}
        </Menu>
      );
    }

    return null;
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
    this.props.selectHandler(item.value);
  };

  renderItem: ItemRenderer<DropdownOption> = (
    option: DropdownOption,
    { handleClick, modifiers },
  ) => {
    if (!modifiers.matchesPredicate) {
      return null;
    }
    return (
      <MenuItem
        active={modifiers.active}
        key={option.value}
        label={option.label ? option.label : ""}
        onClick={handleClick}
        shouldDismissPopover={false}
        text={option.label || option.label}
      />
    );
  };
  getSelectedDisplayText = () => {
    if (this.props.selected) {
      const selectedValue = this.props.selected.value;
      const item: DropdownOption | undefined = this.props.options.find(
        (option) => option.value === selectedValue,
      );

      return item && (item.label || item.label);
    }
    return "";
  };

  render() {
    return (
      <StyledDropdown
        activeItem={this.props.selected}
        filterable={!!this.props.autocomplete}
        itemListRenderer={this.props.addItem && this.renderItemList}
        itemPredicate={this.searchItem}
        itemRenderer={this.renderItem}
        items={this.props.options}
        itemsEqual="value"
        noResults={<MenuItem disabled text="No results." />}
        onItemSelect={this.onItemSelect}
        popoverProps={{ minimal: true }}
      >
        {this.props.toggle || (
          <BaseButton
            buttonStyle="PRIMARY"
            buttonVariant="OUTLINE"
            rightIcon="chevron-down"
            text={this.getSelectedDisplayText()}
          />
        )}
      </StyledDropdown>
    );
  }
}

export interface DropdownComponentProps {
  options: DropdownOption[];
  selectHandler: (selectedValue: string) => void;
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
}

export default DropdownComponent;
