import React, { ReactNode, useState } from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { Dialog, Classes } from "@blueprintjs/core";

const StyledDialog = styled(Dialog)`
  && {
    background: white;
    & .bp3-dialog-footer-actions {
      display: block;
    }
  }
`;

const TriggerWrapper = styled.div``;

type FormDialogComponentProps = {
  isOpen?: boolean;
  title: string;
  Form: any;
  trigger: ReactNode;
};

export const FormDialogComponent = (props: FormDialogComponentProps) => {
  const [isOpen, setIsOpen] = useState(!!props.isOpen);

  const onClose = () => {
    setIsOpen(false);
  };

  const Form = props.Form;

  return (
    <React.Fragment>
      <TriggerWrapper onClick={() => setIsOpen(true)}>
        {props.trigger}
      </TriggerWrapper>

      <StyledDialog
        canOutsideClickClose={false}
        canEscapeKeyClose={false}
        title={props.title}
        onClose={onClose}
        isOpen={isOpen}
      >
        <div className={Classes.DIALOG_BODY}>
          <Form onCancel={onClose} />
        </div>
      </StyledDialog>
    </React.Fragment>
  );
};

export default connect()(FormDialogComponent);
