import styled from "styled-components";
import { Link } from "react-router-dom";
import Form from "components/editorComponents/Form";
import { Card } from "@blueprintjs/core";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Classes } from "@blueprintjs/core";

export const AuthContainer = styled.section`
  position: absolute;
  width: 100%;
  height: ${(props) => `calc(100vh - ${props.theme.headerHeight})`};
  background-color: ${(props) => props.theme.colors.auth.background};
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: auto;

  & .${Classes.FORM_GROUP} {
    margin: 0 0 ${(props) => props.theme.spaces[2]}px;
  }
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
  h1 {
    text-align: center;
    padding: 0;
    margin: 0;
    ${(props) => getTypographyByKey(props, "cardHeader")}
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
    }
    h5 {
      font-size: ${(props) => props.theme.fontSizes[4]}px;
    }
    margin-bottom: ${(props) => props.theme.authCard.dividerSpacing}px;
  }
`;

export const AuthCardNavLink = styled(Link)`
  border-bottom: 1px solid transparent;
  &:hover {
    border-bottom: 1px solid ${(props) => props.theme.colors.auth.link};
    text-decoration: none;
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
  & a {
    font-size: ${(props) => props.theme.fontSizes[3]}px;
  }
  &:only-child {
    margin-right: 0;
  }
`;

export const FormActions = styled.div`
  display: flex;
  & button {
    flex: 1;
  }
  justify-content: space-between;
  align-items: baseline;
  margin-top: ${(props) => props.theme.spaces[5]}px;
  & > label {
    margin-right: ${(props) => props.theme.spaces[11]}px;
  }
`;

export const SignUpLinkSection = styled.div`
  ${(props) => getTypographyByKey(props, "cardSubheader")}
  color: ${(props) => props.theme.colors.auth.text};
  text-align: center;
`;

export const ForgotPasswordLink = styled.div`
  ${(props) => getTypographyByKey(props, "cardSubheader")}
  color: ${(props) => props.theme.colors.auth.text};
  text-align: center;
  margin-top: ${(props) => props.theme.spaces[11]}px;
  & a {
    color: ${(props) => props.theme.colors.auth.text};
  }
`;

export const FormMessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
`;
