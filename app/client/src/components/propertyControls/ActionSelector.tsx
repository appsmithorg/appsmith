import React from "react";
import { ActionPayload, ActionType } from "constants/ActionConstants";
import { DropdownOption } from "widgets/DropdownWidget";
import { MenuItem, Button } from "@blueprintjs/core";
import styled, { theme } from "constants/DefaultTheme";
import { CloseButton } from "components/designSystems/blueprint/CloseButton";
import { StyledDropDown } from "./StyledControls";
import { IItemRendererProps } from "@blueprintjs/select";
import { InputText } from "./InputTextControl";

const DEFAULT_ACTION_TYPE = "Select Action Type" as ActionType;
const DEFAULT_ACTION_LABEL = "Select Action";
enum ACTION_RESOLUTION_TYPE {
  SUCCESS,
  ERROR,
}

const renderItem = (option: DropdownOption, itemProps: IItemRendererProps) => {
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

interface ActionSelectorProps {
  allActions: DropdownOption[];
  actionTypeOptions: DropdownOption[];
  selectedActionType: ActionType;
  selectedActionLabel: string;
  label: string;
  identifier: string;
  labelEditable?: boolean;
  actionResolutionType: ACTION_RESOLUTION_TYPE | string;
  updateActions: (actions: ActionPayload[], key?: string) => void;
  updateLabel?: (label: string, key: string) => void;
  actions: ActionPayload[];
}

export default function ActionSelector(props: ActionSelectorProps) {
  function clearActionSelectorType(
    actionResolutionType: ACTION_RESOLUTION_TYPE | string,
  ) {
    let actionPayloads: ActionPayload[] = props.actions
      ? props.actions.slice()
      : [];
    const actionPayload = actionPayloads[0];
    switch (actionResolutionType) {
      case props.identifier:
        actionPayloads = [];
        break;
      case ACTION_RESOLUTION_TYPE.SUCCESS:
        actionPayload.onSuccess = undefined;
        break;
      case ACTION_RESOLUTION_TYPE.ERROR:
        actionPayload.onError = undefined;
        break;
    }
    props.updateActions(actionPayloads, props.identifier);
  }
  function clearActionSelectorLabel(
    actionResolutionType: ACTION_RESOLUTION_TYPE | string,
  ) {
    let actionPayloads = props.actions.slice();
    const actionPayload = (props.actions[0] as any) as ActionPayload;
    switch (actionResolutionType) {
      case props.identifier:
        actionPayloads = [];
        actionPayloads.push(({
          ...actionPayload,
          actionId: undefined,
          onSuccess: undefined,
          onError: undefined,
        } as any) as ActionPayload);
        break;
      case ACTION_RESOLUTION_TYPE.SUCCESS:
        const successActionPayload =
          actionPayload.onSuccess !== undefined
            ? actionPayload.onSuccess[0]
            : undefined;
        const successActionPayloads = [];
        successActionPayloads.push({
          ...successActionPayload,
          actionId: "",
        });
        actionPayload.onSuccess = successActionPayloads as ActionPayload[];
        break;
      case ACTION_RESOLUTION_TYPE.ERROR:
        const errorActionPayload =
          actionPayload.onError !== undefined
            ? actionPayload.onError[0]
            : undefined;
        const errorActionPayloads = [];
        errorActionPayloads.push({
          ...errorActionPayload,
          actionId: "",
        });
        actionPayload.onError = errorActionPayloads as ActionPayload[];
        break;
    }
    props.updateActions(actionPayloads, props.identifier);
  }

  const onActionTypeSelect = (item: DropdownOption) => {
    const actionPayloads: ActionPayload[] = props.actions
      ? props.actions.slice()
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

    props.updateActions(actionPayloads, props.identifier);
  };

  const onSuccessActionTypeSelect = (item: DropdownOption) => {
    const actionPayloads: ActionPayload[] = props.actions
      ? props.actions.slice()
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
    props.updateActions(actionPayloads, props.identifier);
  };

  const onErrorActionTypeSelect = (item: DropdownOption) => {
    const actionPayloads: ActionPayload[] = props.actions
      ? props.actions.slice()
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
    props.updateActions(actionPayloads, props.identifier);
  };

  const onActionSelect = (item: DropdownOption): void => {
    const actionPayloads: ActionPayload[] = props.actions
      ? props.actions.slice()
      : [];
    const actionPayload = actionPayloads[0];
    actionPayload.actionId = item.value;

    props.updateActions(actionPayloads, props.identifier);
  };

  const onSuccessActionSelect = (item: DropdownOption): void => {
    const actionPayloads: ActionPayload[] = props.actions
      ? props.actions.slice()
      : [];
    const actionPayload = actionPayloads[0];
    const successActionPayloads: ActionPayload[] = actionPayload.onSuccess as ActionPayload[];
    const successActionPayload = successActionPayloads[0];
    successActionPayload.actionId = item.value;
    actionPayload.onSuccess = successActionPayloads;
    props.updateActions(actionPayloads, props.identifier);
  };
  const onErrorActionSelect = (item: DropdownOption): void => {
    const actionPayloads: ActionPayload[] = props.actions
      ? props.actions.slice()
      : [];
    const actionPayload = actionPayloads[0];
    const errorActionPayloads: ActionPayload[] = actionPayload.onError as ActionPayload[];
    const errorActionPayload = errorActionPayloads[0];
    errorActionPayload.actionId = item.value;
    actionPayload.onError = errorActionPayloads;
    props.updateActions(actionPayloads, props.identifier);
  };

  let onTypeSelect = onActionTypeSelect;
  switch (props.actionResolutionType) {
    case ACTION_RESOLUTION_TYPE.SUCCESS:
      onTypeSelect = onSuccessActionTypeSelect;
      break;
    case ACTION_RESOLUTION_TYPE.ERROR:
      onTypeSelect = onErrorActionTypeSelect;
      break;
  }

  let onActionSelectHandler = onActionSelect;
  switch (props.actionResolutionType) {
    case ACTION_RESOLUTION_TYPE.SUCCESS:
      onActionSelectHandler = onSuccessActionSelect;
      break;
    case ACTION_RESOLUTION_TYPE.ERROR:
      onActionSelectHandler = onErrorActionSelect;
      break;
  }

  const showActionTypeRemoveButton =
    props.selectedActionType &&
    props.selectedActionType !== DEFAULT_ACTION_TYPE;
  const showActionLabelRemoveButton =
    props.selectedActionLabel &&
    props.selectedActionLabel !== DEFAULT_ACTION_LABEL;
  const onTextChange = (
    event: React.ChangeEvent<HTMLTextAreaElement> | string,
  ) => {
    let value = event;
    if (typeof event !== "string") {
      value = event.target.value;
    }
    !!props.updateLabel &&
      props.updateLabel((value as any) as string, props.identifier);
    // props.updateProperty(this.props.propertyName, value);
  };
  return (
    <div>
      <div hidden={props.labelEditable}>
        <label>{props.identifier}</label>
      </div>
      <div hidden={!props.labelEditable}>
        <InputText
          label={"Action Name"}
          value={props.label}
          onChange={onTextChange}
          isValid={true}
        ></InputText>
        <label>{"On Action Click"}</label>
      </div>

      <ActionSelectorDropDownContainer>
        <ActionSelectorDropDown
          items={props.actionTypeOptions}
          filterable={false}
          itemRenderer={renderItem}
          onItemSelect={onTypeSelect}
          noResults={<MenuItem disabled={true} text="No results." />}
        >
          {
            <Button
              text={props.selectedActionType}
              rightIcon={showActionTypeRemoveButton ? false : "chevron-down"}
            />
          }
        </ActionSelectorDropDown>
        {showActionTypeRemoveButton && (
          <CloseButton
            size={theme.spaces[5]}
            color={theme.colors.paneSectionLabel}
            onClick={() => {
              clearActionSelectorType(props.actionResolutionType);
            }}
          ></CloseButton>
        )}
      </ActionSelectorDropDownContainer>
      <ActionSelectorDropDownContainer>
        {props.selectedActionType !== DEFAULT_ACTION_TYPE && (
          <ActionSelectorDropDown
            items={props.allActions}
            filterable={false}
            itemRenderer={renderItem}
            onItemSelect={onActionSelectHandler}
            noResults={<MenuItem disabled={true} text="No results." />}
          >
            <Button
              text={props.selectedActionLabel}
              rightIcon={showActionLabelRemoveButton ? false : "chevron-down"}
            />
          </ActionSelectorDropDown>
        )}
        {showActionLabelRemoveButton && (
          <CloseButton
            size={theme.spaces[5]}
            color={theme.colors.paneSectionLabel}
            onClick={() => {
              clearActionSelectorLabel(props.actionResolutionType);
            }}
          ></CloseButton>
        )}
      </ActionSelectorDropDownContainer>
    </div>
  );
}
