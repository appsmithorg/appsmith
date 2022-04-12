import React from "react";
import { useSelector } from "react-redux";
import Dialog from "components/ads/DialogComponent";
import styled, { useTheme } from "styled-components";
import Text, { TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";
import {
  createMessage,
  APPLICATION_IMPORT_SUCCESS,
  APPLICATION_IMPORT_SUCCESS_DESCRIPTION,
} from "@appsmith/constants/messages";
import Icon from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";
import { getCurrentUser } from "selectors/usersSelectors";

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

function ImportedApplicationSuccessModal() {
  const importedAppSuccess = localStorage.getItem("importApplicationSuccess");
  const isOpen = importedAppSuccess === "true";
  const currentUser = useSelector(getCurrentUser);

  const onClose = () => {
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
        </BodyContainer>
      </Container>
    </Dialog>
  );
}

export default ImportedApplicationSuccessModal;
