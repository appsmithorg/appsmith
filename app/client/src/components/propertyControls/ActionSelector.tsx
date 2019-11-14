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
import styled from "styled-components";
import { theme } from "../../constants/DefaultTheme";
import { CloseButton } from "components/designSystems/blueprint/CloseButton";

const DEFAULT_ACTION_TYPE = "Select Action Type" as ActionType;
const DEFAULT_ACTION_LABEL = "Select Action";
enum ACTION_RESOLUTION_TYPE {
  SUCCESS,
  ERROR,
}

const ActionSelectorDropDown = styled(StyledDropDown)`
  &&&&& {
    display: block;
    margin-bottom: 2px;
    width: 100%;
    .bp3-popover-target {
      width: 100%;
      .bp3-button {
        justify-content: flex-start;
        width: 100%;
        .bp3-icon {
          order: 2;
          margin-left: auto;
        }
      }
    }
  }
`;

const ActionSelectorDropDownContainer = styled.div`
  position: relative;
`;

const ResolutionActionContainer = styled.div`
  padding: 0px 0px;
`;
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
        id: action.id,
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
        {selectedActionLabel !== DEFAULT_ACTION_LABEL && (
          <ResolutionActionContainer>
            {this.renderActionSelector(
              allActions,
              actionTypeOptions,
              selectedSuccessActionType,
              selectedSuccessActionLabel,
              "On Success",
              ACTION_RESOLUTION_TYPE.SUCCESS,
            )}
            {this.renderActionSelector(
              allActions,
              actionTypeOptions,
              selectedErrorActionType,
              selectedErrorActionLabel,
              "On Error",
              ACTION_RESOLUTION_TYPE.ERROR,
            )}
          </ResolutionActionContainer>
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

    const showActionTypeRemoveButton =
      selectedActionType && selectedActionType !== DEFAULT_ACTION_TYPE;
    const showActionLabelRemoveButton =
      selectedActionLabel && selectedActionLabel !== DEFAULT_ACTION_LABEL;
    return (
      <div>
        <div>
          <label>{label}</label>
        </div>
        <ActionSelectorDropDownContainer>
          <ActionSelectorDropDown
            items={actionTypeOptions}
            filterable={false}
            itemRenderer={this.renderItem}
            onItemSelect={onTypeSelect}
            noResults={<MenuItem disabled={true} text="No results." />}
          >
            {
              <Button
                text={selectedActionType}
                rightIcon={showActionTypeRemoveButton ? false : "chevron-down"}
              />
            }
          </ActionSelectorDropDown>
          {showActionTypeRemoveButton && (
            <CloseButton
              size={theme.spaces[5]}
              color={theme.colors.paneSectionLabel}
              onClick={() => {
                this.clearActionSelectorType(actionResolutionType);
              }}
            ></CloseButton>
          )}
        </ActionSelectorDropDownContainer>
        <ActionSelectorDropDownContainer>
          {selectedActionType !== DEFAULT_ACTION_TYPE && (
            <ActionSelectorDropDown
              items={allActions}
              filterable={false}
              itemRenderer={this.renderItem}
              onItemSelect={onActionSelect}
              noResults={<MenuItem disabled={true} text="No results." />}
            >
              <Button
                text={selectedActionLabel}
                rightIcon={showActionLabelRemoveButton ? false : "chevron-down"}
              />
            </ActionSelectorDropDown>
          )}
          {showActionLabelRemoveButton && (
            <CloseButton
              size={theme.spaces[5]}
              color={theme.colors.paneSectionLabel}
              onClick={() => {
                this.clearActionSelectorLabel(actionResolutionType);
              }}
            ></CloseButton>
          )}
        </ActionSelectorDropDownContainer>
      </div>
    );
  }
  clearActionSelectorType(
    actionResolutionType: ACTION_RESOLUTION_TYPE | string,
  ) {
    let actionPayloads: ActionPayload[] = this.props.propertyValue
      ? this.props.propertyValue.slice()
      : [];
    const actionPayload = actionPayloads[0];
    switch (actionResolutionType) {
      case this.props.propertyName:
        actionPayloads = [];
        break;
      case ACTION_RESOLUTION_TYPE.SUCCESS:
        actionPayload.onSuccess = undefined;
        break;
      case ACTION_RESOLUTION_TYPE.ERROR:
        actionPayload.onError = undefined;
        break;
    }
    this.updateProperty(this.props.propertyName, actionPayloads);
  }
  clearActionSelectorLabel(
    actionResolutionType: ACTION_RESOLUTION_TYPE | string,
  ) {
    let actionPayloads = this.props.propertyValue.slice();
    const actionPayload = this.props.propertyValue[0];
    switch (actionResolutionType) {
      case this.props.propertyName:
        actionPayloads = [];
        actionPayloads.push({
          ...actionPayload,
          actionId: undefined,
          onSuccess: undefined,
          onError: undefined,
        });
        break;
      case ACTION_RESOLUTION_TYPE.SUCCESS:
        const successActionPayload = actionPayload.onSuccess[0];
        const successActionPayloads = [];
        successActionPayloads.push({
          ...successActionPayload,
          actionId: "",
        });
        actionPayload.onSuccess = successActionPayloads;
        break;
      case ACTION_RESOLUTION_TYPE.ERROR:
        const errorActionPayload = actionPayload.onError[0];
        const errorActionPayloads = [];
        errorActionPayloads.push({
          ...errorActionPayload,
          actionId: "",
        });
        actionPayload.onError = errorActionPayloads;
        break;
    }
    this.updateProperty(this.props.propertyName, actionPayloads);
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
