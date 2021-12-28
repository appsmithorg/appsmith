import React, { useEffect } from "react";
import { Field } from "redux-form";
import CodeEditor from "components/editorComponents/CodeEditor";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { FormInputSwitchToJsonButton } from "components/editorComponents/form/fields/StyledFormComponents";

const SWITCH_CONSTANTS = {
  RAW: "RAW",
  NATIVE: "NATIVE",
};

function SwitchBlock(props: any) {
  useEffect(() => {
    if (props.viewType === undefined) {
      props.input.onChange(SWITCH_CONSTANTS.NATIVE);
    }
  }, []);

  return (
    <FormInputSwitchToJsonButton
      onClick={() => {
        props.input.onChange(
          props.viewType === SWITCH_CONSTANTS.NATIVE
            ? SWITCH_CONSTANTS.RAW
            : SWITCH_CONSTANTS.NATIVE,
        );
      }}
      type="button"
    >
      {/*Hardcoded label to be removed */}
      {`SWITCH TO ${
        props.viewType === SWITCH_CONSTANTS.NATIVE
          ? SWITCH_CONSTANTS.RAW
          : SWITCH_CONSTANTS.NATIVE
      }`}
    </FormInputSwitchToJsonButton>
  );
}

function JSONEditorForRawInput(props: any) {
  return (
    <CodeEditor
      className={"raw-json-editor"}
      dataTreePath={props.rawProperty}
      folding
      height={"100%"}
      hideEvaluatedValue={false}
      input={props.input}
      mode={EditorModes.JSON}
      placeholder="Let's write some code!"
      showLightningMenu={false}
      showLineNumbers
      size={EditorSize.EXTENDED}
      tabBehaviour={TabBehaviour.INDENT}
      theme={EditorTheme.LIGHT}
    />
  );
}

function ToggleJSONToRawButton(props: any) {
  return (
    <Field component={SwitchBlock} name={props.toggleProperty} props={props} />
  );
}

export { ToggleJSONToRawButton };

export default function ToggleJSONToRaw(props: any) {
  return props.viewType === SWITCH_CONSTANTS.RAW ? (
    <Field
      component={JSONEditorForRawInput}
      name={props.rawProperty}
      props={{
        rawProperty: props.rawProperty,
      }}
    />
  ) : (
    props.children
  );
}
