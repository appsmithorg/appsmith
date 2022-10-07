import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ControlProps } from "components/formControls/BaseControl";

//Styled help text, intended to be used with Form Fields
export const StyledFormInfo = styled.span<{ config?: ControlProps }>`
  display: ${(props) =>
    //SWITCH and CHECKBOX display label text and form input aligned side by side
    props?.config?.controlType !== "SWITCH" &&
    props?.config?.controlType !== "CHECKBOX"
      ? "block;"
      : "inline-block;"}
  font-weight: normal;
  color: ${Colors.DOVE_GRAY};
  font-size: 12px;
  margin-left: ${(props) =>
    //SWITCH and CHECKBOX display label text and form input aligned side by side
    props?.config?.controlType !== "SWITCH" &&
    props?.config?.controlType !== "CHECKBOX"
      ? "1px"
      : "0px"};
  margin-top: 5px;
  line-height: 16px;
`;

const FormSubtitleText = styled.span<{ config?: ControlProps }>`
display: ${(props) =>
  //SWITCH and CHECKBOX display label text and form input aligned side by side
  props?.config?.controlType !== "SWITCH" &&
  props?.config?.controlType !== "CHECKBOX"
    ? "block;"
    : "inline;"}
font-weight: normal;
color: ${Colors.DOVE_GRAY};
font-size: 12px;
`;

//Styled help text, intended to be used with Form Fields
const FormInputHelperText = styled.p<{ addMarginTop?: string }>`
  color: ${Colors.GREY_7};
  font-style: normal;
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: -0.221538px;
  margin: 0;

  ${(props) =>
    props.addMarginTop &&
    `
    margin-top: ${props.addMarginTop};
  `}
`;

//Styled error text, intended to be used with Form Fields
const FormInputErrorText = styled.p`
  font-style: normal;
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: -0.221538px;
  color: #f22b2b;
  margin: 8px 0 0 0;
`;

//Styled anchor tag, intended to be used with Form Fields
const FormInputAnchor = styled.a`
  display: block;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  letter-spacing: 0.8px;
  color: #6a86ce;
  margin: 0 0 8px 0;
  text-transform: uppercase;
`;

const FormInputSwitchToJsonButton = styled.button`
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: ${(props) => (props.disabled ? "gray" : "#6a86ce")};
  margin: 0 0 8px 0;
  border: none;
  padding-left: 0;
  display: block;
  cursor: ${(props) => (props.disabled ? "default" : "pointer")};
  background-color: #fff;
`;

//Styled form label tag, intended to be used with Form Fields
const StyledFormLabel = styled.label<{
  config?: ControlProps;
  extraStyles?: any;
}>`
  display: inline-block;
  // TODO: replace condition with props.config?.dataType === "TOGGLE" 
  // required for large texts in CHECKBOX and SWITCH
  width: ${(props) => props.config?.customStyles?.width || "auto;"}
  min-width: ${(props) =>
    props.extraStyles?.minWidth
      ? props.extraStyles?.minWidth
      : props.config?.controlType === "SWITCH" ||
        props.config?.controlType === "CHECKBOX"
      ? "auto;"
      : "20vw;"} 
  font-weight: 400;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0.02em;
  color: ${Colors.CHARCOAL};
  margin-bottom: ${(props) =>
    props.extraStyles?.marginBottom
      ? props.extraStyles?.marginBottom
      : props.config?.controlType === "CHECKBOX"
      ? "0;"
      : "8px;"} 
  &:first-child {
    margin-left: 0;
  }
  p {
    display: flex;
  }
  .label-icon-wrapper {
    margin-bottom: 0;
    display: flex;
    align-items: center;
  }
  .label-icon-wrapper svg path {
    fill: #939090;
  }
`;

const FormEncrytedSection = styled.div`
  display: flex;
  margin-left: 12px;
  align-items: center;
`;

interface FormLabelProps {
  config?: ControlProps;
  children: JSX.Element | React.ReactNode;
  extraStyles?: any;
}

//Wrapper on styled <label/>
function FormLabel(props: FormLabelProps) {
  return (
    <StyledFormLabel config={props.config} extraStyles={props.extraStyles}>
      {props.children}
    </StyledFormLabel>
  );
}

//Wrapper on styled <span/>
function FormInfoText(props: FormLabelProps) {
  return (
    <StyledFormInfo config={props.config}>{props.children}</StyledFormInfo>
  );
}

export {
  FormInputSwitchToJsonButton,
  FormLabel,
  FormInputAnchor,
  FormInputErrorText,
  FormInputHelperText,
  FormInfoText,
  FormSubtitleText,
  FormEncrytedSection,
};
