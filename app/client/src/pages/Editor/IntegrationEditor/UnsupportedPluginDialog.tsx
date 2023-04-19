import React from "react";
import styled from "styled-components";
import { DialogComponent as Dialog, Text, TextType } from "design-system-old";
import { Button, Icon } from "design-system";
import { UNSUPPORTED_PLUGIN_DIALOG_MAIN_HEADING } from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  UNSUPPORTED_PLUGIN_DIALOG_TITLE,
  UNSUPPORTED_PLUGIN_DIALOG_SUBTITLE,
} from "@appsmith/constants/messages";
import { Divider } from "design-system";

type Props = {
  isModalOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
};

const HeaderContents = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: ${(props) => props.theme.spaces[7]}px;
`;

const Heading = styled.div`
  color: ${(props) => props.theme.colors.modal.headerText};
  display: flex;
  justify-content: center;
  font-weight: ${(props) => props.theme.typography.h1.fontWeight};
  font-size: ${(props) => props.theme.typography.h1.fontSize}px;
  line-height: ${(props) => props.theme.typography.h1.lineHeight}px;
  letter-spacing: ${(props) => props.theme.typography.h1.letterSpacing};
`;

const HeaderRight = styled.div`
  display: flex;
`;

const ActionButtonWrapper = styled.div`
  display: flex;
  margin: 30px 0px 0px;
`;

const StyledIcon = styled(Icon)`
  margin: 0px 8px;
`;

const ActionButton = styled(Button)`
  margin-right: 16px;
`;

const Content = styled.div`
  margin: 8px 0px;
`;

const Header = ({ onClose }: { onClose: () => void }) => {
  return (
    <>
      <HeaderContents>
        <Heading>
          <StyledIcon
            className="default_cursor"
            name="warning-triangle"
            size="md"
          />
          {UNSUPPORTED_PLUGIN_DIALOG_MAIN_HEADING()}
        </Heading>
        <HeaderRight>
          <Button
            data-cy="t--product-updates-close-btn"
            isIconButton
            kind="tertiary"
            onClick={onClose}
            size="md"
            startIcon="close-line"
          />
        </HeaderRight>
      </HeaderContents>
      <div>
        <Divider />
      </div>
    </>
  );
};

// Unsupported Plugin for gen CRUD page
function UnsupportedPluginDialog(props: Props) {
  const { isModalOpen, onContinue } = props;
  const handleClose = () => {
    props.onClose();
  };

  return (
    <Dialog
      canEscapeKeyClose
      canOutsideClickClose
      getHeader={() => <Header onClose={props.onClose} />}
      isOpen={isModalOpen}
      setModalClose={handleClose}
    >
      <Content>
        <Text type={TextType.H5}>{UNSUPPORTED_PLUGIN_DIALOG_TITLE()}</Text>
        <br />
        <br />
        <Text type={TextType.P1}>{UNSUPPORTED_PLUGIN_DIALOG_SUBTITLE()}</Text>
      </Content>

      <ActionButtonWrapper>
        <ActionButton
          kind="secondary"
          onClick={() => {
            AnalyticsUtil.logEvent("UNSUPPORTED_PLUGIN_DIALOG_BACK_ACTION");
            handleClose();
          }}
          size="md"
        >
          Back
        </ActionButton>
        <ActionButton
          onClick={() => {
            handleClose();
            AnalyticsUtil.logEvent("UNSUPPORTED_PLUGIN_DIALOG_CONTINUE_ACTION");
            onContinue();
          }}
          size="md"
        >
          Continue Building
        </ActionButton>
      </ActionButtonWrapper>
    </Dialog>
  );
}

export default UnsupportedPluginDialog;
