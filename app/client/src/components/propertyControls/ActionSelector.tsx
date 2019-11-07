import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlWrapper, StyledDropDown } from "./StyledControls";
import { ControlType } from "../../constants/PropertyControlConstants";
import {
  ActionPayload,
  ActionType,
  PropertyPaneActionDropdownOptions,
} from "../../constants/ActionConstants";
import { DropdownOption } from "../../widgets/DropdownWidget";
import { MenuItem, Button } from "@blueprintjs/core";
import { IItemRendererProps } from "@blueprintjs/select";
import { connect } from "react-redux";
import { AppState } from "../../reducers";
import { ActionDataState } from "../../reducers/entityReducers/actionsReducer";

const DEFAULT_ACTION_TYPE = "Select Action Type";

class ActionSelectorControl extends BaseControl<
  ControlProps & ActionDataState
> {
  getSelectionActionType(): string {
    const selectedActionTypeValue =
      this.props.propertyValue &&
      this.props.propertyValue[0] &&
      this.props.propertyValue[0].actionType;

    const foundActionType = PropertyPaneActionDropdownOptions.find(
      actionType => actionType.value === selectedActionTypeValue,
    );

    return foundActionType ? foundActionType.label : DEFAULT_ACTION_TYPE;
  }
  getSelectionActionLabel(allActions: DropdownOption[]): string {
    const selectedActionId =
      this.props.propertyValue &&
      this.props.propertyValue[0] &&
      this.props.propertyValue[0].actionId;

    const foundAction = allActions.find(
      action => action.value === selectedActionId,
    );

    return foundAction ? foundAction.label : "Select Action";
  }
  render() {
    const actionTypeOptions: DropdownOption[] = PropertyPaneActionDropdownOptions;
    const allActions = this.props.data.map(action => {
      return {
        label: action.name,
        value: action.id,
      };
    });
    const selectedActionType = this.getSelectionActionType();
    const selectedActionLabel = this.getSelectionActionLabel(allActions);
    return (
      <ControlWrapper>
        <label>{this.props.label}</label>
        <StyledDropDown
          items={actionTypeOptions}
          filterable={false}
          itemRenderer={this.renderItem}
          onItemSelect={this.onTypeSelect}
          noResults={<MenuItem disabled={true} text="No results." />}
        >
          <Button text={selectedActionType} rightIcon="chevron-down" />
        </StyledDropDown>

        {selectedActionType !== DEFAULT_ACTION_TYPE && (
          <StyledDropDown
            items={allActions}
            filterable={false}
            itemRenderer={this.renderItem}
            onItemSelect={this.onActionSelect}
            noResults={<MenuItem disabled={true} text="No results." />}
          >
            <Button text={selectedActionLabel} rightIcon="chevron-down" />
          </StyledDropDown>
        )}
      </ControlWrapper>
    );
  }

  onTypeSelect = (item: DropdownOption): void => {
    const actionPayloads: ActionPayload[] = this.props.propertyValue
      ? this.props.propertyValue.slice()
      : [];
    const actionPayload = actionPayloads[0];
    if (actionPayload) {
      actionPayload.actionId = "";
      actionPayload.actionType = item.value as ActionType;
    } else {
      const actionPayload = { actionType: item.value } as ActionPayload;
      actionPayloads.push(actionPayload);
    }
    this.updateProperty(this.props.propertyName, actionPayloads);
  };

  onActionSelect = (item: DropdownOption): void => {
    const actionPayloads: ActionPayload[] = this.props.propertyValue
      ? this.props.propertyValue.slice()
      : [];
    const actionPayload = actionPayloads[0];
    actionPayload.actionId = item.value as ActionType;

    this.updateProperty(this.props.propertyName, actionPayloads);
  };

  renderItem = (option: DropdownOption, itemProps: IItemRendererProps) => {
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    return (
      <MenuItem
        active={itemProps.modifiers.active}
        key={option.value}
        onClick={itemProps.handleClick}
        text={option.label}
      />
    );
  };

  getControlType(): ControlType {
    return "ACTION_SELECTOR";
  }
}

export interface ActionSelectorControlProps extends ControlProps {
  propertyValue: ActionPayload[];
}

const mapStateToProps = (state: AppState): ActionDataState => ({
  ...state.entities.actions,
});

export default connect(mapStateToProps)(ActionSelectorControl);
