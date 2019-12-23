import React from "react";
import styled from "styled-components";
import FormActionButton from "components/editorComponents/form/FormActionButton";
import Divider from "components/editorComponents/Divider";

type FormFooterProps = {
  onCancel?: () => void;
  onSubmit?: () => void;
  divider?: boolean;
  submitting: boolean;
  submitText?: string;
  cancelText?: string;
  submitOnEnter?: boolean;
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

const FormFooterContainer = styled.div`
  padding: 1em 0;
`;

export const FormFooter = (props: FormFooterProps) => {
  return (
    <FormFooterContainer>
      {props.divider && <Divider />}
      <FooterActions>
        {props.onCancel && (
          <FormActionButton
            text={props.cancelText || "Cancel"}
            type="button"
            onClick={props.onCancel}
            large
          />
        )}
        {props.onSubmit && (
          <FormActionButton
            text={props.submitText || "Submit"}
            type={props.submitOnEnter ? "submit" : "button"}
            intent="primary"
            onClick={props.onSubmit}
            loading={props.submitting}
            large
          />
        )}
      </FooterActions>
    </FormFooterContainer>
  );
};

export default FormFooter;
