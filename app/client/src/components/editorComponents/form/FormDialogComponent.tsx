import React, { ReactNode, useState, useEffect } from "react";
import { isPermitted } from "pages/Applications/permissionHelpers";
import Dialog from "components/ads/DialogComponent";
import { useDispatch } from "react-redux";
import { setShowAppInviteUsersDialog } from "actions/applicationActions";
import { IconName } from "components/ads/Icon";

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
  headerIcon?: {
    name: IconName;
    fillColor?: string;
    hoverColor?: string;
    bgColor?: string;
  };
};

export function FormDialogComponent(props: FormDialogComponentProps) {
  const [isOpen, setIsOpenState] = useState(!!props.isOpen);
  const dispatch = useDispatch();

  const setIsOpen = (isOpen: boolean) => {
    setIsOpenState(isOpen);
    dispatch(setShowAppInviteUsersDialog(isOpen));
  };

  useEffect(() => {
    setIsOpen(!!props.isOpen);
  }, [props.isOpen]);

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
      headerIcon={props.headerIcon}
      isOpen={isOpen}
      onOpening={() => setIsOpen(true)}
      setMaxWidth={props.setMaxWidth}
      setModalClose={() => setIsOpen(false)}
      title={props.title}
      trigger={props.trigger}
    >
      <Form
        applicationId={props.applicationId}
        onCancel={() => setIsOpen(false)}
        orgId={props.orgId}
      />
    </Dialog>
  );
}

export default FormDialogComponent;
