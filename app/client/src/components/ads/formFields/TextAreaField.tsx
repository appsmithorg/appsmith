import React from "react";
import { Field, WrappedFieldMetaProps } from "redux-form";
import { Intent } from "constants/DefaultTheme";
import FormFieldError from "components/ads/formFields/FieldError";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import CodeEditor, {
  EditorProps,
} from "components/editorComponents/CodeEditor";

const renderComponent = (
  componentProps: FormTextAreaFieldProps &
    EditorProps & {
      meta: Partial<WrappedFieldMetaProps>;
    },
) => {
  const showError = componentProps.meta.touched && !componentProps.meta.active;
  const theme = EditorTheme.LIGHT;
  return (
    <>
      <CodeEditor
        height={"156px"}
        hideEvaluatedValue
        showLightningMenu={false}
        {...componentProps}
        hinting={[]}
        mode={EditorModes.TEXT}
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={theme}
      />
      {!componentProps.hideErrorMessage && componentProps.meta.error && (
        <FormFieldError error={showError && componentProps.meta.error} />
      )}
    </>
  );
};

export type FormTextAreaFieldProps = {
  name: string;
  placeholder: string;
  label?: string;
  intent?: Intent;
  disabled?: boolean;
  autoFocus?: boolean;
  hideErrorMessage?: boolean;
};

function FormTextAreaField(props: FormTextAreaFieldProps) {
  return <Field component={renderComponent} {...props} asyncControl />;
}

export default FormTextAreaField;
