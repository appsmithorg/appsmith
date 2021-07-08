import React from "react";
import Button from "components/editorComponents/Button";
import Text, { TextType } from "../../../components/ads/Text";
import { HelpIcons } from "icons/HelpIcons";
import { withTheme } from "styled-components";
import styled from "styled-components";
import { Color } from "../../../constants/Colors";
import Dialog from "components/ads/DialogComponent";

type Props = {
  isModalOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
};

const HeaderContents = styled.div`
  padding: ${(props) => props.theme.spaces[9]}px;
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

export const StyledSeparator = styled.div`
  width: 100%;
  background-color: ${(props) => props.theme.colors.modal.separator};
  opacity: 0.6;
  height: 1px;
`;

const CloseIcon = HelpIcons.CLOSE_ICON;

const Header = withTheme(
  ({ onClose, theme }: { onClose: () => void; theme: any }) => (
    <>
      <HeaderContents>
        <Heading>⚠️ Heads Up</Heading>
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
      <div style={{ padding: `0 ${theme.spaces[9]}px` }}>
        <StyledSeparator />
      </div>
    </>
  ),
);

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
    >
      <div>
        <Text type={TextType.H4}>
          This Datasource is not currently supported to generate template page
        </Text>
        <br />
        <Text type={TextType.P1}>
          Select another datasource to generate CRUD interface or continue to
          manually build the application
        </Text>
      </div>
      <div>
        <div>
          <Button
            filled
            onClick={() => {
              handleClose();
            }}
            text="SELECT OTHER DATASOURCE"
          />
          <Button
            filled
            intent="primary"
            onClick={() => {
              handleClose();
              onContinue();
            }}
            text="CONTINUE"
          />
        </div>
      </div>
    </Dialog>
  );
}

export default UnsupportedPluginDialog;
