import type { ReactNode } from "react";
import React, { useState, useEffect } from "react";
import { isPermitted } from "@appsmith/utils/permissionHelpers";
import type { TabProp, IconName } from "design-system-old";
import {
  DialogComponent as Dialog,
  TabComponent,
  Text,
  TextType,
  Icon,
  IconSize,
} from "design-system-old";
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

const TabWrapper = styled.div<{ hasMessage: boolean }>`
  position: relative;
  .react-tabs__tab-list {
    margin: ${(props) => (props.hasMessage ? `16px 0` : `0 0 16px`)};
    border-bottom: 2px solid var(--appsmith-color-black-200);
  }
`;

const TabCloseBtnContainer = styled.div`
  position: absolute;
  right: 0;
  top: 0;
`;

type FormDialogComponentProps = {
  isOpen?: boolean;
  canOutsideClickClose?: boolean;
  canEscapeKeyClose?: boolean;
  isCloseButtonShown?: boolean;
  noModalBodyMarginTop?: boolean;
  workspaceId?: string;
  title?: string;
  message?: string;
  Form: any;
  trigger: ReactNode;
  onClose?: () => void;
  onOpenOrClose?: (isOpen: boolean) => void;
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
  placeholder?: string;
  getHeader?: () => ReactNode;
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
              {...(tab.customProps?.onSubmitHandler
                ? {
                    onSubmitHandler: (values: any) =>
                      tab.customProps.onSubmitHandler({
                        ...values,
                        selectedTab: tab.key,
                      }),
                  }
                : {})}
              applicationId={applicationId}
              dropdownMaxHeight={tab.dropdownMaxHeight}
              dropdownPlaceholder={tab.dropdownPlaceholder}
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

  useEffect(() => {
    setIsOpen(!!props.isOpen);
  }, [props.isOpen]);

  const setIsOpen = (isOpen: boolean) => {
    setIsOpenState(isOpen);
    props.onOpenOrClose && props.onOpenOrClose(isOpen);
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
      canEscapeKeyClose={!!props.canEscapeKeyClose}
      canOutsideClickClose={!!props.canOutsideClickClose}
      getHeader={props.getHeader}
      headerIcon={props.headerIcon}
      isCloseButtonShown={props.isCloseButtonShown}
      isOpen={isOpen}
      noModalBodyMarginTop={props.noModalBodyMarginTop}
      onClose={onCloseHandler}
      onOpening={() => setIsOpen(true)}
      setMaxWidth={props.setMaxWidth}
      setModalClose={() => setIsOpen(false)}
      title={props.title}
      trigger={props.trigger}
    >
      {updatedTabs && updatedTabs.length > 0 ? (
        <TabWrapper hasMessage={!!props.message}>
          {!props.message && (
            <TabCloseBtnContainer
              className="t--close-form-dialog"
              onClick={onCloseHandler}
            >
              <Icon
                fillColor={Colors.SCORPION}
                hoverFillColor={Colors.GREY_900}
                name="close-modal"
                size={IconSize.XXXXL}
              />
            </TabCloseBtnContainer>
          )}
          {props.message && (
            <LabelText type={TextType.P0}>{props.message}</LabelText>
          )}
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
