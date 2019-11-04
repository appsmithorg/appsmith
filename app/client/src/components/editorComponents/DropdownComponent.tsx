import React, { Component } from "react";
import styled from "styled-components";
import { MenuItem, Menu, ControlGroup, InputGroup } from "@blueprintjs/core";
import { BaseButton } from "../designSystems/blueprint/ButtonComponent";
import {
  ItemRenderer,
  Select,
  ItemListRenderer,
  IItemListRendererProps,
} from "@blueprintjs/select";
import { DropdownOption } from "../../widgets/DropdownWidget";

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
          icon-right="plus"
          styleName="primary"
          filled={true}
          text={this.props.addItem.displayText}
          onClick={this.showTextBox}
        />
      );
      const editMode = (
        <ControlGroup fill={true}>
          <InputGroup inputRef={this.setNewItemTextInput} />
          <BaseButton
            filled={true}
            text={this.props.addItem.displayText}
            onClick={this.handleAddItem}
          ></BaseButton>
        </ControlGroup>
      );
      return (
        <Menu ulRef={props.itemsParentRef}>
          {renderItems}
          {!this.state.isEditing ? displayMode : editMode}
        </Menu>
      );
    }

    return <React.Fragment />;
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
        option => option.value === selectedValue,
      );

      return item && (item.label || item.label);
    }
    return "";
  };
  render() {
    return (
      <StyledDropdown
        items={this.props.options}
        onItemSelect={this.onItemSelect}
        itemRenderer={this.renderItem}
        itemListRenderer={this.props.addItem && this.renderItemList}
        filterable={!!this.props.autocomplete}
        itemPredicate={this.searchItem}
        itemsEqual="value"
        popoverProps={{ minimal: true }}
        activeItem={this.props.selected}
        noResults={<MenuItem disabled={true} text="No results." />}
      >
        <BaseButton
          styleName="secondary"
          text={this.getSelectedDisplayText()}
          rightIcon="chevron-down"
        />
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
}

export default DropdownComponent;
