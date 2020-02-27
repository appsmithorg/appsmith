import styled, { css } from "styled-components";
import { Link } from "react-router-dom";
import Form from "components/editorComponents/Form";
import { Card } from "@blueprintjs/core";

export const AuthContainer = styled.section`
  position: absolute;
  width: 100%;
  height: 100vh;
  will-change: transform, opacity;
`;

export const AuthCard = styled(Card)`
  width: ${props => props.theme.authCard.width}px;
  background: ${props => props.theme.authCard.background};
  border-radius: ${props => props.theme.authCard.borderRadius}px;
  padding: ${props => props.theme.authCard.padding}px;
  box-shadow: ${props => props.theme.authCard.shadow};
  border: none;
  & h1,
  h5 {
    padding: 0;
    margin: 0;
    font-weight: ${props => props.theme.fontWeights[1]};
  }
`;

export const AuthCardContainer = styled.div``;

export const AuthCardHeader = styled.header`
  & {
    h1 {
      font-size: ${props => props.theme.fontSizes[6]}px;
    }
    h5 {
      font-size: ${props => props.theme.fontSizes[4]}px;
    }
    margin-bottom: ${props => props.theme.authCard.dividerSpacing}px;
  }
`;

export const AuthCardNavLink = styled(Link)`
  text-align: center;
  margin: 0 auto;
  display: block;
  margin-top: ${props => props.theme.spaces[12]}px;
  & span {
    margin-left: ${props => props.theme.spaces[4]}px;
  }
`;

export const AuthCardFooter = styled.footer`
  display: flex;
  width: 100%;
  justify-content: space-evenly;
  align-items: baseline;
  margin-top: ${props => props.theme.authCard.dividerSpacing}px;
`;

export const AuthCardBody = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  & a {
    margin-top: ${props => props.theme.spaces[8]}px;
    font-size: ${props => props.theme.fontSizes[2]}px;
  }
`;

const formSpacing = css`
  flex-grow: 1;
  margin-right: ${props => props.theme.authCard.dividerSpacing}px;
`;

export const SpacedForm = styled(Form)`
  ${formSpacing}
`;

export const SpacedSubmitForm = styled.form`
  ${formSpacing}
  & a {
    font-size: ${props => props.theme.fontSizes[3]}px;
  }
`;

export const FormActions = styled.div`
  display: flex;
  & button {
    flex: 1;
  }
  justify-content: space-between;
  align-items: baseline;
  margin-top: ${props => props.theme.spaces[2]}px;
  & > label {
    margin-right: ${props => props.theme.spaces[11]}px;
  }
`;
