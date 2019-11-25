import React, { ReactNode, useState, useEffect } from "react";
import { connect } from "react-redux";
import { submit } from "redux-form";
import { Dialog, Classes, Button, Intent, Callout } from "@blueprintjs/core";

type FormDialogComponentProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  form: ReactNode;
  isSubmitting: boolean;
  submitIntent: string;
  formName: string;
  error?: string;
  dispatch: Function;
};

export const FormDialogComponent = (props: FormDialogComponentProps) => {
  const submitHandler = () => props.dispatch(submit(props.formName));
  const [isPristine, makePristine] = useState(true);

  const clearErrors = () => {
    makePristine(true);
  };

  useEffect(() => {
    if (props.error) {
      makePristine(false);
    }
  }, [props.error]);

  return (
    <Dialog
      isOpen={props.isOpen}
      canOutsideClickClose={false}
      canEscapeKeyClose={false}
      title={props.title}
      onClose={props.onClose}
      onOpening={clearErrors}
    >
      {props.error && !isPristine && (
        <Callout intent="danger">{props.error}</Callout>
      )}
      <div className={Classes.DIALOG_BODY}>{props.form}</div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button
            text="Cancel"
            type="button"
            intent={Intent.NONE}
            onClick={props.onClose}
          />
          <Button
            text="Submit"
            type="submit"
            onClick={submitHandler}
            intent={props.submitIntent as Intent}
            loading={props.isSubmitting && !props.error}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default connect()(FormDialogComponent);
