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

const DEFAULT_ACTION_TYPE = "Select Action Type" as ActionType;
const DEFAULT_ACTION_LABEL = "Select Action";
enum ACTION_RESOLUTION_TYPE {
  SUCCESS,
  ERROR,
}

function getActions(
  actionPayloads: ActionPayload[] | undefined,
): {
  action: ActionPayload | undefined;
  onSuccessAction: ActionPayload | undefined;
  onErrorAction: ActionPayload | undefined;
} {
  const action: ActionPayload | undefined = actionPayloads && actionPayloads[0];
  const onSuccessAction: ActionPayload | undefined =
    action && action.onSuccess && action.onSuccess[0];
  const onErrorAction: ActionPayload | undefined =
    action && action.onError && action.onError[0];
  return {
    action,
    onSuccessAction,
    onErrorAction,
  };
}

class ActionSelectorControl extends BaseControl<
  ControlProps & ActionDataState
> {
  getSelectionActionType(type: ACTION_RESOLUTION_TYPE | string): ActionType {
    let selectedActionTypeValue: ActionType | undefined;
    const { action, onSuccessAction, onErrorAction } = getActions(
      this.props.propertyValue,
    );

    switch (type) {
      case this.props.propertyName:
        selectedActionTypeValue = action && action.actionType;
        break;
      case ACTION_RESOLUTION_TYPE.SUCCESS:
        selectedActionTypeValue = onSuccessAction && onSuccessAction.actionType;
        break;
      case ACTION_RESOLUTION_TYPE.ERROR:
        selectedActionTypeValue = onErrorAction && onErrorAction.actionType;
        break;
      default:
        break;
    }

    const foundActionType = PropertyPaneActionDropdownOptions.find(
      actionType => actionType.value === selectedActionTypeValue,
    );

    return foundActionType
      ? (foundActionType.label as ActionType)
      : DEFAULT_ACTION_TYPE;
  }
  getSelectionActionLabel(
    type: ACTION_RESOLUTION_TYPE | string,
    allActions: DropdownOption[],
  ): string {
    let selectedActionId: string | undefined = "";
    const { action, onSuccessAction, onErrorAction } = getActions(
      this.props.propertyValue,
    );

    switch (type) {
      case this.props.propertyName:
        selectedActionId = action && action.actionId;
        break;
      case ACTION_RESOLUTION_TYPE.SUCCESS:
        selectedActionId = onSuccessAction && onSuccessAction.actionId;
        break;
      case ACTION_RESOLUTION_TYPE.ERROR:
        selectedActionId = onErrorAction && onErrorAction.actionId;
        break;
      default:
        break;
    }

    const foundAction = allActions.find(
      action => action.value === selectedActionId,
    );

    return foundAction ? foundAction.label : DEFAULT_ACTION_LABEL;
  }
  render() {
    const actionTypeOptions: DropdownOption[] = PropertyPaneActionDropdownOptions;
    const allActions = this.props.data.map(action => {
      return {
        label: action.name,
        value: action.id,
      };
    });
    const selectedActionType = this.getSelectionActionType(
      this.props.propertyName,
    );
    const selectedActionLabel = this.getSelectionActionLabel(
      this.props.propertyName,
      allActions,
    );

    const selectedSuccessActionType = this.getSelectionActionType(
      ACTION_RESOLUTION_TYPE.SUCCESS,
    );
    const selectedSuccessActionLabel = this.getSelectionActionLabel(
      ACTION_RESOLUTION_TYPE.SUCCESS,
      allActions,
    );

    const selectedErrorActionType = this.getSelectionActionType(
      ACTION_RESOLUTION_TYPE.ERROR,
    );
    const selectedErrorActionLabel = this.getSelectionActionLabel(
      ACTION_RESOLUTION_TYPE.ERROR,
      allActions,
    );
    return (
      <ControlWrapper>
        {this.renderActionSelector(
          allActions,
          actionTypeOptions,
          selectedActionType,
          selectedActionLabel,
          this.props.propertyName,
          this.props.propertyName,
        )}
        {selectedActionLabel !== DEFAULT_ACTION_LABEL &&
          this.renderActionSelector(
            allActions,
            actionTypeOptions,
            selectedSuccessActionType,
            selectedSuccessActionLabel,
            "On Success",
            ACTION_RESOLUTION_TYPE.SUCCESS,
          )}
        {selectedActionLabel !== DEFAULT_ACTION_LABEL &&
          this.renderActionSelector(
            allActions,
            actionTypeOptions,
            selectedErrorActionType,
            selectedErrorActionLabel,
            "On Error",
            ACTION_RESOLUTION_TYPE.ERROR,
          )}
      </ControlWrapper>
    );
  }

  renderActionSelector(
    allActions: DropdownOption[],
    actionTypeOptions: DropdownOption[],
    selectedActionType: ActionType,
    selectedActionLabel: string,
    label: string,
    actionResolutionType: ACTION_RESOLUTION_TYPE | string,
  ) {
    let onTypeSelect = this.onActionTypeSelect;
    switch (actionResolutionType) {
      case ACTION_RESOLUTION_TYPE.SUCCESS:
        onTypeSelect = this.onSuccessActionTypeSelect;
        break;
      case ACTION_RESOLUTION_TYPE.ERROR:
        onTypeSelect = this.onErrorActionTypeSelect;
        break;
    }

    let onActionSelect = this.onActionSelect;
    switch (actionResolutionType) {
      case ACTION_RESOLUTION_TYPE.SUCCESS:
        onActionSelect = this.onSuccessActionSelect;
        break;
      case ACTION_RESOLUTION_TYPE.ERROR:
        onActionSelect = this.onErrorActionSelect;
        break;
    }
    return (
      <div>
        <div>
          <label>{label}</label>
        </div>
        <StyledDropDown
          items={actionTypeOptions}
          filterable={false}
          itemRenderer={this.renderItem}
          onItemSelect={onTypeSelect}
          noResults={<MenuItem disabled={true} text="No results." />}
        >
          <Button text={selectedActionType} rightIcon="chevron-down" />
        </StyledDropDown>

        {selectedActionType !== DEFAULT_ACTION_TYPE && (
          <StyledDropDown
            items={allActions}
            filterable={false}
            itemRenderer={this.renderItem}
            onItemSelect={onActionSelect}
            noResults={<MenuItem disabled={true} text="No results." />}
          >
            <Button text={selectedActionLabel} rightIcon="chevron-down" />
          </StyledDropDown>
        )}
      </div>
    );
  }
  onActionTypeSelect = (item: DropdownOption) => {
    const actionPayloads: ActionPayload[] = this.props.propertyValue
      ? this.props.propertyValue.slice()
      : [];
    const actionPayload = actionPayloads[0];

    if (actionPayload && actionPayload.actionType !== item.value) {
      actionPayload.actionId = "";
      actionPayload.onError = undefined;
      actionPayload.onSuccess = undefined;
      actionPayload.actionType = item.value as ActionType;
    } else {
      const actionPayload = { actionType: item.value } as ActionPayload;
      actionPayloads.push(actionPayload);
    }

    this.updateProperty(this.props.propertyName, actionPayloads);
  };
  onSuccessActionTypeSelect = (item: DropdownOption) => {
    const actionPayloads: ActionPayload[] = this.props.propertyValue
      ? this.props.propertyValue.slice()
      : [];
    const actionPayload = actionPayloads[0];

    if (actionPayload) {
      const successActionPayloads: ActionPayload[] =
        actionPayload.onSuccess || [];
      const successActionPayload = successActionPayloads[0];
      if (successActionPayload) {
        successActionPayload.actionId = "";
        successActionPayload.actionType = item.value as ActionType;
      } else {
        const successActionPayload = {
          actionType: item.value,
        } as ActionPayload;
        successActionPayloads.push(successActionPayload);
      }
      actionPayload.onSuccess = successActionPayloads;
    }
    this.updateProperty(this.props.propertyName, actionPayloads);
  };
  onErrorActionTypeSelect = (item: DropdownOption) => {
    const actionPayloads: ActionPayload[] = this.props.propertyValue
      ? this.props.propertyValue.slice()
      : [];
    const actionPayload = actionPayloads[0];

    if (actionPayload) {
      const errorActionPayloads: ActionPayload[] = actionPayload.onError || [];
      const errorActionPayload = errorActionPayloads[0];
      if (errorActionPayload) {
        errorActionPayload.actionId = "";
        errorActionPayload.actionType = item.value as ActionType;
      } else {
        const errorActionPayload = {
          actionType: item.value,
        } as ActionPayload;
        errorActionPayloads.push(errorActionPayload);
      }
      actionPayload.onError = errorActionPayloads;
    }
    this.updateProperty(this.props.propertyName, actionPayloads);
  };

  onActionSelect = (item: DropdownOption): void => {
    const actionPayloads: ActionPayload[] = this.props.propertyValue
      ? this.props.propertyValue.slice()
      : [];
    const actionPayload = actionPayloads[0];
    actionPayload.actionId = item.value;

    this.updateProperty(this.props.propertyName, actionPayloads);
  };
  onSuccessActionSelect = (item: DropdownOption): void => {
    const actionPayloads: ActionPayload[] = this.props.propertyValue
      ? this.props.propertyValue.slice()
      : [];
    const actionPayload = actionPayloads[0];
    const successActionPayloads: ActionPayload[] = actionPayload.onSuccess as ActionPayload[];
    const successActionPayload = successActionPayloads[0];
    successActionPayload.actionId = item.value;
    actionPayload.onSuccess = successActionPayloads;
    this.updateProperty(this.props.propertyName, actionPayloads);
  };
  onErrorActionSelect = (item: DropdownOption): void => {
    const actionPayloads: ActionPayload[] = this.props.propertyValue
      ? this.props.propertyValue.slice()
      : [];
    const actionPayload = actionPayloads[0];
    const errorActionPayloads: ActionPayload[] = actionPayload.onError as ActionPayload[];
    const errorActionPayload = errorActionPayloads[0];
    errorActionPayload.actionId = item.value;
    actionPayload.onError = errorActionPayloads;
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
