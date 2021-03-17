import React, { ReactNode, useState, useCallback } from "react";
import { isPermitted } from "pages/Applications/permissionHelpers";
import Dialog from "components/ads/DialogComponent";

type FormDialogComponentProps = {
  isOpen?: boolean;
  canOutsideClickClose?: boolean;
  orgId?: string;
  title: string;
  Form: any;
  trigger: ReactNode;
  permissionRequired?: string;
  permissions?: string[];
  setMaxWidth?: boolean;
  applicationId?: string;
};

export const FormDialogComponent = (props: FormDialogComponentProps) => {
  const [isOpen, setIsOpen] = useState(!!props.isOpen);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // track if the dialog is open to close it when clicking cancel within the form
  const onOpening = useCallback(() => {
    setIsOpen(true);
  }, []);

  const Form = props.Form;

  if (
    props.permissions &&
    props.permissionRequired &&
    !isPermitted(props.permissions, props.permissionRequired)
  )
    return null;

  return (
    <React.Fragment>
      <Dialog
        canOutsideClickClose={!!props.canOutsideClickClose}
        title={props.title}
        isOpen={isOpen}
        setMaxWidth={props.setMaxWidth}
        trigger={props.trigger}
        onOpening={onOpening}
      >
        <Form
          onCancel={onClose}
          orgId={props.orgId}
          applicationId={props.applicationId}
        />
      </Dialog>
    </React.Fragment>
  );
};

export default FormDialogComponent;
