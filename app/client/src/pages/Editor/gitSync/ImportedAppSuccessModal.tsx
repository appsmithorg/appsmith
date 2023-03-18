import React, { useState } from "react";
import { useSelector } from "react-redux";
import styled, { useTheme } from "styled-components";
import { DialogComponent as Dialog, Text, TextType } from "design-system-old";
import { Colors } from "constants/Colors";
import {
  createMessage,
  APPLICATION_IMPORT_SUCCESS,
  APPLICATION_IMPORT_SUCCESS_DESCRIPTION,
} from "@appsmith/constants/messages";
import { Icon } from "design-system-old";
import { getCurrentUser } from "selectors/usersSelectors";
import { Button, Category, Size } from "design-system-old";
import type { Theme } from "constants/DefaultTheme";

const Container = styled.div`
  height: 461px;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: hidden;
  justify-content: center;
  align-content: center;
`;

const BodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  .cs-icon {
    margin: auto;
    svg {
      width: 68px;
      height: 68px;
    }
  }

  .cs-text {
    text-align: center;
  }
`;

const ActionButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 30px 0px 0px;
  position: absolute;
  width: 100%;
  bottom: 0px;
`;

const ActionButton = styled(Button)`
  margin-right: 16px;
`;

function ImportedApplicationSuccessModal() {
  const importedAppSuccess = localStorage.getItem("importApplicationSuccess");
  // const isOpen = importedAppSuccess === "true";
  const [isOpen, setIsOpen] = useState(importedAppSuccess === "true");
  const currentUser = useSelector(getCurrentUser);

  const onClose = () => {
    setIsOpen(false);
    localStorage.setItem("importApplicationSuccess", "false");
  };
  const theme = useTheme() as Theme;
  return (
    <Dialog
      canEscapeKeyClose
      canOutsideClickClose
      className="t--import-app-success-modal"
      isOpen={isOpen}
      maxWidth={"900px"}
      noModalBodyMarginTop
      onClose={onClose}
      width={"600px"}
    >
      <Container>
        <BodyContainer>
          <Icon fillColor={Colors.GREEN_1} name="oval-check-fill" />
          <Text
            color={Colors.BLACK}
            style={{ marginTop: 64 }}
            type={TextType.DANGER_HEADING}
            weight="bold"
          >
            {createMessage(
              APPLICATION_IMPORT_SUCCESS,
              currentUser?.name || currentUser?.username,
            )}
          </Text>
          <Text
            color={Colors.GRAY_700}
            style={{ marginTop: theme.spaces[3] }}
            type={TextType.P1}
          >
            {createMessage(APPLICATION_IMPORT_SUCCESS_DESCRIPTION)}
          </Text>
          <ActionButtonWrapper>
            <ActionButton
              category={Category.primary}
              className="t--import-success-modal-got-it"
              onClick={() => {
                onClose();
              }}
              size={Size.medium}
              text="GOT IT"
            />
          </ActionButtonWrapper>
        </BodyContainer>
      </Container>
    </Dialog>
  );
}

export default ImportedApplicationSuccessModal;
