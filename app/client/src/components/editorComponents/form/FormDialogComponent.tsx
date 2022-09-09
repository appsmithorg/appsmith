import React, { ReactNode, useState, useEffect } from "react";
import { isPermitted } from "pages/Applications/permissionHelpers";
import Dialog from "components/ads/DialogComponent";
import { useDispatch } from "react-redux";
import { setShowAppInviteUsersDialog } from "actions/applicationActions";
import { TabComponent, TabProp } from "components/ads/Tabs";
import { Text, TextType, IconName } from "design-system";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { INVITE_USERS_TO_WORKSPACE_FORM } from "@appsmith/constants/forms";

const LabelText = styled(Text)`
  font-size: 14px;
  color: ${Colors.GREY_8};
  margin-bottom: 8px;
  line-height: 1.57;
  letter-spacing: -0.24px;
`;

const TabWrapper = styled.div`
  .react-tabs__tab-list {
    margin: 16px 0;
    border-bottom: 2px solid var(--appsmith-color-black-200);
  }
`;

type FormDialogComponentProps = {
  isOpen?: boolean;
  canOutsideClickClose?: boolean;
  workspaceId?: string;
  title: string;
  message?: string;
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
  selected?: any;
  tabs?: any[];
  options?: any[];
  links?: any[];
  placeholder?: string;
};

const getTabs = (
  tabs: any[],
  setIsOpen: (val: boolean) => void,
  applicationId?: string,
  workspaceId?: string,
) => {
  return tabs && tabs.length > 0
    ? tabs.map((tab) => {
        const TabForm = tab.component;
        return {
          key: tab.key,
          title: tab.title,
          panelComponent: (
            <TabForm
              {...tab.customProps}
              applicationId={applicationId}
              formName={`${INVITE_USERS_TO_WORKSPACE_FORM}_${tab.key}`}
              onCancel={() => setIsOpen(false)}
              options={tab.options}
              placeholder={tab.placeholder || ""}
              workspaceId={workspaceId}
            />
          ),
        };
      })
    : [];
};

export function FormDialogComponent(props: FormDialogComponentProps) {
  const [isOpen, setIsOpenState] = useState(!!props.isOpen);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsOpen(!!props.isOpen);
  }, [props.isOpen]);

  const setIsOpen = (isOpen: boolean) => {
    setIsOpenState(isOpen);
    dispatch(setShowAppInviteUsersDialog(isOpen));
  };

  const onCloseHandler = () => {
    props?.onClose?.();
    setIsOpen(false);
  };

  const updatedTabs: TabProp[] =
    props.tabs && props.tabs.length > 0
      ? getTabs(props.tabs, setIsOpen, props.applicationId, props.workspaceId)
      : [];

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
      onClose={onCloseHandler}
      onOpening={() => setIsOpen(true)}
      setMaxWidth={props.setMaxWidth}
      setModalClose={() => setIsOpen(false)}
      title={props.title}
      trigger={props.trigger}
    >
      {updatedTabs && updatedTabs.length > 0 ? (
        <TabWrapper>
          <LabelText type={TextType.P0}>{props.message}</LabelText>
          <TabComponent
            onSelect={setSelectedTabIndex}
            selectedIndex={selectedTabIndex}
            tabs={updatedTabs}
          />
        </TabWrapper>
      ) : (
        <Form
          {...props.customProps}
          applicationId={props.applicationId}
          links={props.links}
          message={props.message}
          onCancel={() => setIsOpen(false)}
          placeholder={props.placeholder}
          selected={props.selected}
          workspaceId={props.workspaceId}
        />
      )}
    </Dialog>
  );
}

export default FormDialogComponent;
