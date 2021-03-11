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

export function FormDialogComponent(props: FormDialogComponentProps) {
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
    <Dialog
      canOutsideClickClose={!!props.canOutsideClickClose}
      isOpen={isOpen}
      onOpening={onOpening}
      setMaxWidth={props.setMaxWidth}
      title={props.title}
      trigger={props.trigger}
    >
      <Form
        applicationId={props.applicationId}
        onCancel={onClose}
        orgId={props.orgId}
      />
    </Dialog>
  );
}

export default FormDialogComponent;
