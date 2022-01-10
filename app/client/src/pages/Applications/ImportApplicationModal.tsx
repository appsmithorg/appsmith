import React, { useCallback, useState } from "react";
import styled, { useTheme } from "styled-components";
import Button, { Size } from "components/ads/Button";
import { StyledDialog } from "./ForkModalStyles";
import { useSelector } from "store";
import { AppState } from "reducers";
import { SetProgress, FileType } from "components/ads/FilePicker";
import { useDispatch } from "react-redux";
import {
  // importApplication,
  setIsImportAppModalOpen,
} from "actions/applicationActions";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import {
  createMessage,
  IMPORT_APPLICATION_MODAL_LABEL,
  IMPORT_APPLICATION_MODAL_TITLE,
  IMPORT_APP_FROM_FILE_MESSAGE,
  IMPORT_APP_FROM_FILE_TITLE,
  IMPORT_APP_FROM_GIT_MESSAGE,
  IMPORT_APP_FROM_GIT_TITLE,
} from "constants/messages";
import FilePickerV2 from "components/ads/FilePickerV2";
import { Colors } from "constants/Colors";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";
import { getIsImportAppModalOpen } from "selectors/applicationSelectors";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";

const ImportButton = styled(Button)<{ disabled?: boolean }>`
  height: 30px;
  width: 81px;
  pointer-events: ${(props) => (!!props.disabled ? "none" : "auto")};
`;

const TextWrapper = styled.div`
  padding-top: ${(props) => props.theme.spaces[11]}px;
  padding-bottom: ${(props) => props.theme.spaces[12] + 2}px;
`;

const Row = styled.div`
  display: flex;
  padding: 0px;
  margin: 0px;
  justify-content: space-between;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: ${(props) => props.theme.spaces[6]}px;
`;

const FilePickerWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardWrapper = styled.div`
  width: 320px;
  height: 200px;
  border: 1px solid ${Colors.MERCURY};
  display: flex;
  align-items: center;
  flex-direction: column;
  cursor: pointer;
  &:hover {
    background: ${Colors.MERCURY};
  }
  .cs-icon {
    border-radius: 50%;
    width: 32px;
    height: 32px;
    background: ${Colors.MERCURY};
    display: flex;
    justify-content: center;
    margin-top: 35px;
    margin-bottom: 32px;
  }
  .cs-text {
    max-width: 250px;
    text-align: center;
  }
`;

function ImportCard(props: {
  icon: IconName;
  title: string;
  message: string;
  handler?: () => void;
}) {
  const theme = useTheme() as Theme;
  const onClick = useCallback(() => {
    props.handler && props.handler();
  }, []);
  return (
    <CardWrapper onClick={onClick}>
      <Icon fillColor={Colors.GREY_7} name={props.icon} size={IconSize.XL} />
      <Text
        color={Colors.OXFORD_BLUE}
        style={{ marginBottom: theme.spaces[4] }}
        type={TextType.P1}
      >
        {props.title}
      </Text>
      <Text color={Colors.GREY_6} type={TextType.P1}>
        {props.message}
      </Text>
    </CardWrapper>
  );
}

type ImportApplicationModalProps = {
  // import?: (file: any) => void;
  organizationId?: string;
  isModalOpen?: boolean;
  onClose?: () => void;
};

function ImportApplicationModal(props: ImportApplicationModalProps) {
  const isOpen = useSelector(getIsImportAppModalOpen);
  // const [appFileToBeUploaded, setAppFileToBeUploaded] = useState<{
  //   file: File;
  //   setProgress: SetProgress;
  // } | null>(null);

  const dispatch = useDispatch();
  const onClose = useCallback(() => {
    dispatch(setIsImportAppModalOpen({ isOpen: false }));
  }, []);

  const onGitImport = useCallback(() => {
    dispatch(setIsImportAppModalOpen({ isOpen: false }));
    dispatch(
      setIsGitSyncModalOpen({
        isOpen: true,
        tab: GitSyncModalTab.GIT_CONNECTION,
      }),
    );
    // dispatch(setIsImportAppViaGitModalOpen({ isOpen: true }));
  }, []);

  // const importingApplication = useSelector(
  //   (state: AppState) => state.ui.applications.importingApplication,
  // );

  // const FileUploader = useCallback(
  //   async (file: File, setProgress: SetProgress) => {
  //     if (!!file) {
  //       setAppFileToBeUploaded({
  //         file,
  //         setProgress,
  //       });
  //     } else {
  //       setAppFileToBeUploaded(null);
  //     }
  //   },
  //   [],
  // );

  // const onImportApplication = useCallback(() => {
  //   if (!appFileToBeUploaded) {
  //     Toaster.show({
  //       text: "Please choose a valid application file!",
  //       variant: Variant.danger,
  //     });
  //     return;
  //   }
  //   const { file } = appFileToBeUploaded || {};

  //   dispatch(
  //     importApplication({
  //       orgId: organizationId as string,
  //       applicationFile: file,
  //     }),
  //   );
  // }, [appFileToBeUploaded, organizationId]);

  // const onRemoveFile = useCallback(() => setAppFileToBeUploaded(null), []);
  return (
    <StyledDialog
      canOutsideClickClose
      className={"t--import-application-modal"}
      headerIcon={{
        name: "right-arrow",
        bgColor: Colors.GEYSER_LIGHT,
      }}
      isOpen={isOpen}
      maxHeight={"540px"}
      setModalClose={onClose}
      title={createMessage(IMPORT_APPLICATION_MODAL_TITLE)}
      width="710px"
    >
      <TextWrapper>
        <Text type={TextType.P1}>
          {createMessage(IMPORT_APPLICATION_MODAL_LABEL)}
        </Text>
      </TextWrapper>
      <Row>
        <ImportCard
          icon="file-line"
          message={createMessage(IMPORT_APP_FROM_FILE_MESSAGE)}
          title={createMessage(IMPORT_APP_FROM_FILE_TITLE)}
        />
        <ImportCard
          handler={onGitImport}
          icon="fork"
          message={createMessage(IMPORT_APP_FROM_GIT_MESSAGE)}
          title={createMessage(IMPORT_APP_FROM_GIT_TITLE)}
        />
      </Row>
      {/* <ButtonWrapper>
        <ImportButton
          // category={ButtonCategory.tertiary}
          cypressSelector={"t--org-import-app-button"}
          disabled={!appFileToBeUploaded}
          isLoading={importingApplication}
          onClick={onImportApplication}
          size={Size.large}
          text={"IMPORT"}
        />
      </ButtonWrapper> */}
    </StyledDialog>
  );
}

export default ImportApplicationModal;
