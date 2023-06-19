import React, { useState } from "react";
import styled from "styled-components";
import FormTextField from "components/utils/ReduxFormTextField";
import FormTextAreaField from "pages/Settings/FormGroup/TextAreaField";
import { createMessage } from "@appsmith/constants/messages";

import { SettingsFormWrapper } from "pages/Settings/components";
import { Icon, Text, Tooltip } from "design-system";
import { SettingTypes } from "../config/types";
import KeyValueArrayControl from "components/formControls/KeyValueArrayControl";
import InputTextControl from "components/propertyControls/InputTextControl";

export const Info = styled(Text)`
  margin: 16px 0;
`;

export const MenuContainer = styled.div`
  margin-top: 8px;
`;

export const BodyContainer = styled.div`
  width: 100%;
  padding: 0 0 16px;
`;

export const InputContainer = styled.div`
  margin: 0 0 16px;
  & > span {
    display: flex;
    align-items: center;
    margin: 8px 0;
    .help-icon {
      margin-left: 8px;
      cursor: pointer;
      svg {
        border-radius: 50%;
        border: 1px solid var(--ads-v2-color-fg);
        padding: 1px;
        fill: var(--ads-v2-color-fg);
      }
    }
  }
  .CodeEditorTarget {
    z-index: 0;
  }
`;

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: var(--ads-v2-color-fg);
  .help-icon {
    margin-left: 8px;
    cursor: pointer;
  }
`;

export const RaisedCard = styled(SettingsFormWrapper)`
  height: 86px;
  margin-top: 24px;
  padding: 0 32px;
  box-shadow: 0 12px 16px -4px rgba(16, 24, 40, 0.1),
    0 4px 6px -2px rgba(16, 24, 40, 0.05);
  h3,
  a {
    margin: 0;
    color: var(--ads-v2-color-fg);
  }
  display: flex;
  align-items: center;
  justify-content: center;
  h3 {
    flex-grow: 1;
    color: var(--ads-v2-color-fg);
  }
`;

export const StyledAsterisk = styled(Text)`
  color: var(--ads-v2-color-fg-error);
  margin-left: 2px;
`;

const AccordionWrapper = styled.div`
  margin-top: 40px;
`;

const AccordionHeader = styled(Text)`
  margin-bottom: ${(props) => props.theme.spaces[9]}px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AccordionBody = styled.div`
  & .hide {
    display: none;
  }
`;

const Line = styled.hr`
  display: block;
  height: 1px;
  border: 0;
  border-top: 1px solid var(--ads-v2-color-border);
  margin: 0 16px;
  flex: 1 0 auto;
}
`;

const AdvancedSettingsWrapper = styled.div`
  .field-label {
    margin-bottom: 8px;
    display: block;
  }

  .form-input-field {
    flex: 1 0 0;
  }
`;

export type InputProps = {
  className?: string;
  placeholder?: string;
  label: string;
  name: string;
  subText?: string;
  hint?: string;
  type?: "Area" | "Text" | "KeyValueFieldArray";
  isRequired?: boolean;
};

export function Input(props: InputProps) {
  const { isRequired, name, placeholder, type = "Text" } = props;
  let InputField;
  if (type === "Area") {
    InputField = (
      <FormTextAreaField
        setting={{
          controlType: SettingTypes.TEXTINPUT,
          id: "APPSMITH_OAUTH2_SAML_METADATA_XML",
          name: name,
          placeholder: createMessage(() => placeholder || ""),
        }}
      />
    );
  } else {
    InputField = (
      <FormTextField
        name={name}
        placeholder={createMessage(() => placeholder || "")}
        type="text"
      />
    );
  }
  return (
    <InputContainer>
      <HeaderWrapper>
        <Text color="var(--ads-v2-color-fg)" kind="body-m" renderAs="label">
          {props.label}
          {isRequired && <StyledAsterisk>*</StyledAsterisk>}
        </Text>
        {props.hint && (
          <Tooltip content={props.hint} placement="right">
            <Icon
              className={"help-icon"}
              color="var(--ads-v2-color-fg)"
              name="question-line"
              size="md"
            />
          </Tooltip>
        )}
      </HeaderWrapper>
      {InputField}
      {props.subText && (
        <Text color="var(--ads-v2-color-fg-muted" renderAs="p">
          {props.subText}
        </Text>
      )}
    </InputContainer>
  );
}

export function RenderForm(props: { inputs: InputProps[] }) {
  return (
    <>
      {props.inputs.map((eachInput) => (
        <Input key={eachInput.name} {...eachInput} />
      ))}
    </>
  );
}

export function Accordion(props: any) {
  const [isOpen, setIsOpen] = useState(false);
  const { label, settings } = props;

  return (
    <AccordionWrapper>
      {label && (
        <AccordionHeader
          color="var(--ads-v2-color-fg)"
          data-testid="admin-settings-form-group-label"
          kind="heading-s"
          onClick={() => setIsOpen(!isOpen)}
          renderAs="label"
        >
          <span>{createMessage(() => label)}</span>
          <Line />
          <Icon name={isOpen ? "expand-less" : "expand-more"} size="md" />
        </AccordionHeader>
      )}
      {isOpen && (
        <AccordionBody>
          {settings.map((eachInput: any) => (
            <AdvancedSettingsWrapper key={eachInput.name}>
              <Text
                className="field-label"
                color="var(--ads-v2-color-fg)"
                kind="body-m"
                renderAs="label"
              >
                {eachInput.label}
              </Text>
              {eachInput.type === "KeyValueFieldArray" ? (
                <KeyValueArrayControl
                  configProperty={eachInput.name}
                  controlType={typeof InputTextControl}
                  formName={eachInput.name}
                  headerTooltips={{
                    key: "The key under which the claim would be present in the appsmith.user.userClaims object in your application.",
                    value: "SAML claim name",
                  }}
                  id={eachInput.name}
                  isValid
                  label={eachInput.label}
                  name={eachInput.name}
                  showHeader
                />
              ) : (
                <Input {...eachInput} />
              )}
            </AdvancedSettingsWrapper>
          ))}
        </AccordionBody>
      )}
    </AccordionWrapper>
  );
}
