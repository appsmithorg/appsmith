import React from "react";
import styled from "styled-components";
import Button from "components/editorComponents/Button";
import Divider from "components/editorComponents/Divider";

type FormFooterProps = {
  onCancel?: () => void;
  onSubmit?: () => void;
  divider?: boolean;
  submitting: boolean;
  submitText?: string;
  cancelText?: string;
  submitOnEnter?: boolean;
  canSubmit?: boolean;
  size?: "large" | "small";
};

const FooterActions = styled.div`
  margin: 1em;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  & > button {
    margin-left: 1em;
  }
  &&&& > .bp3-button {
    color: ${(props) => props.theme.colors.formFooter.cancelBtn};
  }
`;

const FormFooterContainer = styled.div``;

export function FormFooter(props: FormFooterProps) {
  return (
    <FormFooterContainer>
      {props.divider && <Divider />}
      <FooterActions>
        {props.onCancel && (
          <Button
            filled
            onClick={props.onCancel}
            size={props.size}
            text={props.cancelText || "Cancel"}
            type="button"
          />
        )}
        <Button
          disabled={props.canSubmit === false}
          filled
          intent="primary"
          loading={props.submitting}
          onClick={props.onSubmit}
          size={props.size}
          text={props.submitText || "Submit"}
          type={props.submitOnEnter ? "submit" : "button"}
        />
      </FooterActions>
    </FormFooterContainer>
  );
}

export default FormFooter;
