import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import Tooltip from "components/ads/Tooltip";
import Text, { TextType } from "components/ads/Text";
import FormTextField from "components/ads/formFields/TextField";
import FormTextAreaField from "components/ads/formFields/TextAreaField";
import { HelpIcons } from "icons/HelpIcons";
import { createMessage } from "@appsmith/constants/messages";
import { Position } from "@blueprintjs/core";

const HelpIcon = HelpIcons.HELP_ICON;

export const Wrapper = styled.div`
  flex-basis: calc(100% - ${(props) => props.theme.homePage.leftPane.width}px);
  margin-left: ${(props) => props.theme.homePage.main.marginLeft}px;
  padding-top: 40px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
  overflow: auto;
`;

export const HeaderWrapper = styled.div`
  margin-bottom: 16px;
`;

export const SettingsHeader = styled.h2`
  font-size: 24px;
  font-weight: 500;
  text-transform: capitalize;
  margin-bottom: 0px;
`;

export const SettingsSubHeader = styled.div`
  font-size: 12px;
`;

export const HeaderSecondary = styled.h3`
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: -0.24px;
  text-align: left;
`;

export const Info = styled.h3`
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 19px;
  letter-spacing: -0.24px;
  text-align: left;
  margin: 16px 0;
`;

export const MenuContainer = styled.div`
  margin-top: 8px;
`;

export const SettingsFormWrapper = styled.div`
  max-width: 40rem;
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
        border: 1px solid ${Colors.GREY_7};
        padding: 1px;
      }
    }
  }
  .CodeEditorTarget {
    z-index: 0;
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
  }
  display: flex;
  align-items: center;
  justify-content: center;
  h3 {
    flex-grow: 1;
  }
`;

export const StyledAsterisk = styled.span`
  color: ${Colors.ERROR_RED};
  margin-left: 2px;
`;

export type InputProps = {
  className?: string;
  placeholder?: string;
  label: string;
  name: string;
  subText?: string;
  hint?: string;
  type?: "Area" | "Text";
  isRequired?: boolean;
};

export function Input(props: InputProps) {
  const { isRequired, name, placeholder, type = "Text" } = props;
  let InputField;
  if (type === "Area") {
    InputField = (
      <FormTextAreaField
        disabled={false}
        name={name}
        placeholder={createMessage(() => placeholder || "")}
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
      <Text color={Colors.GREY_9} type={TextType.P1}>
        {props.label}
        {isRequired && <StyledAsterisk>*</StyledAsterisk>}
        {props.hint && (
          <Tooltip
            autoFocus={false}
            content={props.hint}
            hoverOpenDelay={0}
            minWidth={"180px"}
            openOnTargetFocus={false}
            position={Position.RIGHT}
          >
            <HelpIcon
              className={"help-icon"}
              color={Colors.GREY_7}
              height={13}
              width={13}
            />
          </Tooltip>
        )}
      </Text>
      {InputField}
      {props.subText && (
        <Text color={Colors.GREY_7} type={TextType.P3}>
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
