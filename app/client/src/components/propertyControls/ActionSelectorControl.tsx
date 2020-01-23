import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlWrapper } from "./StyledControls";
import { ControlType } from "constants/PropertyControlConstants";
import {
  ActionPayload,
  ActionType,
  PropertyPaneActionDropdownOptions,
} from "constants/ActionConstants";
import { DropdownOption } from "widgets/DropdownWidget";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import styled from "styled-components";
import ActionSelector from "./ActionSelector";
import { RestAction } from "api/ActionAPI";

const DEFAULT_ACTION_TYPE = "Select Action Type" as ActionType;
const DEFAULT_ACTION_LABEL = "Select Action";
enum ACTION_RESOLUTION_TYPE {
  SUCCESS,
  ERROR,
}

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
interface FinalActionSelectorProps {
  actions: ActionPayload[];
  identifier: string;
  actionsData: RestAction[];
  label: string;
  labelEditable?: boolean;
  updateLabel?: (label: string, key: string) => void;
  updateActions: (actions: ActionPayload[], key?: string) => void;
}
export function FinalActionSelector(props: FinalActionSelectorProps) {
  function getSelectionActionType(
    type: ACTION_RESOLUTION_TYPE | string,
  ): ActionType {
    let selectedActionTypeValue: ActionType | undefined;
    const { action, onSuccessAction, onErrorAction } = getActions(
      props.actions,
    );

    switch (type) {
      case props.identifier:
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
  function getSelectionActionLabel(
    type: ACTION_RESOLUTION_TYPE | string,
    allActions: DropdownOption[],
  ): string {
    let selectedActionId: string | undefined = "";
    const { action, onSuccessAction, onErrorAction } = getActions(
      props.actions,
    );

    switch (type) {
      case props.identifier:
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
  const actionTypeOptions: DropdownOption[] = PropertyPaneActionDropdownOptions;
  const allActions = props.actionsData.map(action => {
    return {
      label: action.name,
      value: action.id,
      id: action.id,
    };
  });
  const selectedActionType = getSelectionActionType(props.identifier);
  const selectedActionLabel = getSelectionActionLabel(
    props.identifier,
    allActions,
  );

  const selectedSuccessActionType = getSelectionActionType(
    ACTION_RESOLUTION_TYPE.SUCCESS,
  );
  const selectedSuccessActionLabel = getSelectionActionLabel(
    ACTION_RESOLUTION_TYPE.SUCCESS,
    allActions,
  );

  const selectedErrorActionType = getSelectionActionType(
    ACTION_RESOLUTION_TYPE.ERROR,
  );
  const selectedErrorActionLabel = getSelectionActionLabel(
    ACTION_RESOLUTION_TYPE.ERROR,
    allActions,
  );
  return (
    <ControlWrapper>
      <ActionSelector
        allActions={allActions}
        actionTypeOptions={actionTypeOptions}
        selectedActionType={selectedActionType}
        selectedActionLabel={selectedActionLabel}
        label={props.label}
        identifier={props.identifier}
        actionResolutionType={props.identifier}
        updateActions={props.updateActions}
        updateLabel={props.updateLabel}
        actions={props.actions}
        labelEditable={props.labelEditable}
      ></ActionSelector>
      {selectedActionLabel !== DEFAULT_ACTION_LABEL && (
        <ResolutionActionContainer>
          <ActionSelector
            allActions={allActions}
            actionTypeOptions={actionTypeOptions}
            selectedActionType={selectedSuccessActionType}
            selectedActionLabel={selectedSuccessActionLabel}
            identifier={"On Success"}
            label={"On Success"}
            actionResolutionType={ACTION_RESOLUTION_TYPE.SUCCESS}
            updateActions={props.updateActions}
            updateLabel={props.updateLabel}
            actions={props.actions}
          ></ActionSelector>
          <ActionSelector
            allActions={allActions}
            actionTypeOptions={actionTypeOptions}
            selectedActionType={selectedErrorActionType}
            selectedActionLabel={selectedErrorActionLabel}
            identifier={"On SucceErrorss"}
            label={"On Error"}
            actionResolutionType={ACTION_RESOLUTION_TYPE.ERROR}
            updateActions={props.updateActions}
            updateLabel={props.updateLabel}
            actions={props.actions}
          ></ActionSelector>
        </ResolutionActionContainer>
      )}
    </ControlWrapper>
  );
}

class ActionSelectorControl extends BaseControl<
  ControlProps & ActionDataState
> {
  render() {
    return (
      <FinalActionSelector
        actionsData={this.props.data}
        label={this.props.propertyName}
        actions={this.props.propertyValue}
        identifier={this.props.propertyName}
        updateActions={this.updateActions}
      ></FinalActionSelector>
    );
  }

  updateActions = (actions: ActionPayload[]) => {
    this.updateProperty(this.props.propertyName, actions);
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
