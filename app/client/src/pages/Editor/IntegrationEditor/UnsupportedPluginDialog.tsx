import React from "react";
import { HelpIcons } from "icons/HelpIcons";
import styled, { useTheme } from "styled-components";
import { Color } from "constants/Colors";
import { DialogComponent as Dialog, Text, TextType } from "design-system-old";
import { Button, Icon } from "design-system";
import { UNSUPPORTED_PLUGIN_DIALOG_MAIN_HEADING } from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  UNSUPPORTED_PLUGIN_DIALOG_TITLE,
  UNSUPPORTED_PLUGIN_DIALOG_SUBTITLE,
} from "@appsmith/constants/messages";
import { Theme } from "constants/DefaultTheme";

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

const CloseIconContainer = styled.div`
  width: 20px;
  height: 20px;
  cursor: pointer;
  &:hover {
    background-color: ${(props) => props.theme.colors.modal.hoverState};
  }
`;

const ActionButtonWrapper = styled.div`
  display: flex;
  margin: 30px 0px 0px;
`;

export const StyledSeparator = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.colors.modal.separator};
  opacity: 0.6;
  height: 1px;
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

const CloseIcon = HelpIcons.CLOSE_ICON;

const Header = ({ onClose }: { onClose: () => void }) => {
  const theme = useTheme() as Theme;

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
          <CloseIconContainer
            data-cy="t--product-updates-close-btn"
            onClick={onClose}
          >
            <CloseIcon
              color={theme.colors.text.normal as Color}
              height={20}
              width={20}
            />
          </CloseIconContainer>
        </HeaderRight>
      </HeaderContents>
      <div>
        <StyledSeparator />
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
