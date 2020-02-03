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
`;

const FormFooterContainer = styled.div``;

export const FormFooter = (props: FormFooterProps) => {
  return (
    <FormFooterContainer>
      {props.divider && <Divider />}
      <FooterActions>
        {props.onCancel && (
          <Button
            text={props.cancelText || "Cancel"}
            type="button"
            onClick={props.onCancel}
            size={props.size}
            filled
          />
        )}
        <Button
          text={props.submitText || "Submit"}
          type={props.submitOnEnter ? "submit" : "button"}
          intent="primary"
          onClick={props.onSubmit}
          disabled={props.canSubmit === false}
          loading={props.submitting}
          size={props.size}
          filled
        />
      </FooterActions>
    </FormFooterContainer>
  );
};

export default FormFooter;
