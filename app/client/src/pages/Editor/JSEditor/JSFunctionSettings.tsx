import React from "react";
import styled from "styled-components";
import Checkbox from "components/ads/Checkbox";
import Dialog from "components/ads/DialogComponent";
import TextInput from "components/ads/TextInput";
import Text, { TextType } from "components/ads/Text";
import { JSAction } from "entities/JSCollection";
import { updateFunctionProperty } from "actions/jsPaneActions";
import { useDispatch } from "react-redux";
import {
  createMessage,
  JS_SETTINGS_ONPAGELOAD,
  JS_SETTINGS_ONPAGELOAD_SUBTEXT,
  JS_SETTINGS_CONFIRM_EXECUTION,
  JS_SETTINGS_CONFIRM_EXECUTION_SUBTEXT,
  JS_SETTINGS_EXECUTE_TIMEOUT,
} from "constants/messages";

const FormRow = styled.div`
  margin-bottom: ${(props) => props.theme.spaces[10] + 1}px;
  &.flex {
    display: flex;
    align-items: center;
    .cs-text {
      margin-right: 30px;
      color: rgb(9, 7, 7);
    }
  }
`;

interface JSFunctionSettingsProps {
  action: JSAction;
  openSettings: boolean;
  toggleSettings: () => void;
}

function JSFunctionSettings(props: JSFunctionSettingsProps) {
  const { action } = props;
  const dispatch = useDispatch();
  const updateProperty = (value: boolean | number, propertyName: string) => {
    dispatch(
      updateFunctionProperty({
        action: props.action,
        propertyName: propertyName,
        value: value,
      }),
    );
  };

  const timeoutInMillisecond = action.actionConfiguration.timeoutInMillisecond
    ? action.actionConfiguration.timeoutInMillisecond.toString()
    : "";

  return (
    <Dialog
      canOutsideClickClose
      isOpen={props.openSettings}
      onClose={props.toggleSettings}
      title={`Function settings - ${props.action.name}`}
    >
      <FormRow>
        <Checkbox
          fill={false}
          info={createMessage(JS_SETTINGS_ONPAGELOAD_SUBTEXT)}
          isDefaultChecked={action.executeOnLoad}
          label={createMessage(JS_SETTINGS_ONPAGELOAD)}
          onCheckChange={(value: boolean) =>
            updateProperty(value, "executeOnLoad")
          }
        />
      </FormRow>
      <FormRow>
        <Checkbox
          fill={false}
          info={createMessage(JS_SETTINGS_CONFIRM_EXECUTION_SUBTEXT)}
          isDefaultChecked={action.confirmBeforeExecute}
          label={createMessage(JS_SETTINGS_CONFIRM_EXECUTION)}
          onCheckChange={(value: boolean) =>
            updateProperty(value, "confirmBeforeExecute")
          }
        />
      </FormRow>
      <FormRow className="flex">
        <Text type={TextType.P1}>
          {createMessage(JS_SETTINGS_EXECUTE_TIMEOUT)}
        </Text>
        <TextInput
          dataType={"text"}
          defaultValue={timeoutInMillisecond}
          onChange={(value: string) =>
            updateProperty(
              Number(value),
              "actionConfiguration.timeoutInMillisecond",
            )
          }
        />
      </FormRow>
    </Dialog>
  );
}
export default JSFunctionSettings;
