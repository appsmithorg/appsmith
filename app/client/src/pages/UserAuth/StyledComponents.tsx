import styled from "styled-components";
import { Link } from "react-router-dom";
import Form from "components/editorComponents/Form";
import { Card } from "@blueprintjs/core";
import { FormGroup, getTypographyByKey } from "@appsmith/ads-old";

export const AuthContainer = styled.section`
  position: absolute;
  width: 100%;
  height: ${(props) => `calc(100vh - ${props.theme.headerHeight})`};
  background-color: ${(props) => props.theme.colors.auth.background};
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: auto;
`;

export const AuthCardContainer = styled.div`
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  justify-content: center;
  padding: ${(props) => props.theme.authCard.padding}px 0;
`;

export const AuthCard = styled(Card)`
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.colors.auth.cardBackground};
  padding: ${(props) => props.theme.spaces[15]}px 64px;
  width: ${(props) => props.theme.authCard.width}px;
  border: none;
  box-shadow: none;
  border-radius: 0;
  h1 {
    text-align: center;
    padding: 0;
    margin: 0;
    ${getTypographyByKey("cardHeader")}
    color: ${(props) => props.theme.colors.auth.headingText};
  }
  & .form-message-container {
    width: ${(props) => props.theme.authCard.formMessageWidth}px;
    align-self: center;
    text-align: center;
  }
  .form-message-container ~ .form-message-container {
    margin-top: ${(props) => props.theme.spaces[4]}px;
  }
  & > div {
    margin-bottom: ${(props) => props.theme.spaces[14]}px;
  }
  & > div:last-child,
  & > div:empty {
    margin-bottom: 0;
  }
`;

export const AuthCardHeader = styled.header`
  & {
    h1 {
      font-size: ${(props) => props.theme.fontSizes[6]}px;
      white-space: nowrap;
      font-weight: 500;
    }
    h5 {
      font-size: ${(props) => props.theme.fontSizes[4]}px;
    }
    margin-bottom: ${(props) => props.theme.authCard.dividerSpacing}px;
  }
`;

export const AuthCardNavLink = styled(Link)`
  border-bottom: 1px solid transparent;
  color: ${(props) => props.theme.colors.auth.link};
  &:hover {
    border-bottom: 1px solid ${(props) => props.theme.colors.auth.link};
    text-decoration: none;
    color: ${(props) => props.theme.colors.auth.link};
  }
`;

export const AuthCardFooter = styled.footer`
  display: flex;
  width: 100%;
  justify-content: space-evenly;
  align-items: baseline;
  margin-top: ${(props) => props.theme.authCard.dividerSpacing}px;
`;

export const AuthCardBody = styled.div`
  & a {
    margin-top: ${(props) => props.theme.spaces[8]}px;
    font-size: ${(props) => props.theme.fontSizes[2]}px;
  }
`;

export const SpacedForm = styled(Form)``;

export const SpacedSubmitForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  && .bp3-label {
    color: var(--ads-v2-color-fg);
    margin-bottom: var(--ads-v2-spaces-2);
  }
  & a {
    font-size: ${(props) => props.theme.fontSizes[3]}px;
  }
  &:only-child {
    margin-right: 0;
  }
  .bp3-form-group {
    margin: 0;
  }
`;

export const EmailFormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const FormActions = styled.div`
  display: flex;
  & button {
    flex: 1;
  }
  justify-content: space-between;
  align-items: baseline;
  & > label {
    margin-right: ${(props) => props.theme.spaces[11]}px;
  }
`;

export const SignUpLinkSection = styled.div`
  ${getTypographyByKey("cardSubheader")}
  color: ${(props) => props.theme.colors.auth.text};
  text-align: center;
`;

export const ForgotPasswordLink = styled.div`
  ${getTypographyByKey("cardSubheader")}
  color: ${(props) => props.theme.colors.auth.text};
  text-align: center;
  & a {
    color: ${(props) => props.theme.colors.auth.text};
  }
`;

export const FormMessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

export const BlackAuthCardNavLink = styled(AuthCardNavLink)`
  color: #000;
  border-bottom: 1px solid transparent;
  &:hover {
    color: #000;
    border-bottom: 1px solid #000;
  }
`;

export const StyledFormGroup = styled(FormGroup)`
  && .bp3-label {
    color: var(--ads-v2-color-fg);
    margin-bottom: var(--ads-v2-spaces-2);
  }
`;

export const OrWithLines = styled.div`
  overflow: hidden;
  text-align: center;

  &::before,
  &::after {
    background-color: var(--ads-v2-color-border);
    content: "";
    display: inline-block;
    height: 1px;
    position: relative;
    vertical-align: middle;
    width: 50%;
  }

  &::before {
    right: 0.5em;
    margin-left: -50%;
  }

  &::after {
    left: 0.5em;
    margin-right: -50%;
  }
`;
