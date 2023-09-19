import React from "react";
import type { WrappedFieldMetaProps, WrappedFieldInputProps } from "redux-form";
import { Field } from "redux-form";
import { TagInput } from "design-system-old";
import { FormGroup } from "./Common";
import type { Intent } from "constants/DefaultTheme";
import type { Setting } from "@appsmith/pages/AdminSettings/config/types";
import styled from "styled-components";

const StyledTagInput = styled(TagInput)`
  .bp3-tag-input-values {
    flex-wrap: nowrap;
    width: 100%;
    overflow: auto;

    &::-webkit-scrollbar {
      height: 0px;
    }
  }
`;

const renderComponent = (
  componentProps: TagListFieldProps & {
    meta: Partial<WrappedFieldMetaProps>;
    input: Partial<WrappedFieldInputProps>;
  },
) => {
  const setting = componentProps.setting;
  return (
    <FormGroup
      className={`tag-input t--admin-settings-tag-input t--admin-settings-${
        setting.name || setting.id
      }`}
      setting={setting}
    >
      <StyledTagInput {...componentProps} />
    </FormGroup>
  );
};

type TagListFieldProps = {
  name: string;
  placeholder: string;
  type: string;
  label?: React.ReactNode;
  intent: Intent;
  setting: Setting;
  customError?: (err: string) => void;
};

function TagInputField(props: TagListFieldProps) {
  return <Field component={renderComponent} {...props} />;
}

export default TagInputField;
