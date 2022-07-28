import React, { ReactNode, useState, useEffect } from "react";
import { isPermitted } from "pages/Applications/permissionHelpers";
import Dialog from "components/ads/DialogComponent";
import { useDispatch } from "react-redux";
import { setShowAppInviteUsersDialog } from "actions/applicationActions";
import { IconName } from "components/ads/Icon";

type FormDialogComponentProps = {
  isOpen?: boolean;
  canOutsideClickClose?: boolean;
  workspaceId?: string;
  title: string;
  Form: any;
  trigger: ReactNode;
  onClose?: () => void;
  customProps?: any;
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

  const onCloseHandler = () => {
    props?.onClose?.();
    setIsOpen(false);
  };

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
      onClose={onCloseHandler}
      onOpening={() => setIsOpen(true)}
      setMaxWidth={props.setMaxWidth}
      setModalClose={() => setIsOpen(false)}
      title={props.title}
      trigger={props.trigger}
    >
      <Form
        {...props.customProps}
        applicationId={props.applicationId}
        onCancel={() => setIsOpen(false)}
        workspaceId={props.workspaceId}
      />
    </Dialog>
  );
}

export default FormDialogComponent;
