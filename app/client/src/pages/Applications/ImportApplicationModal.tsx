import React, { ReactNode, useCallback, useEffect, useState } from "react";
import styled, { useTheme } from "styled-components";
import { StyledDialog } from "./ForkModalStyles";
import { useSelector } from "store";
import { SetProgress, FileType } from "components/ads/FilePicker";
import { useDispatch } from "react-redux";
import { importApplication } from "actions/applicationActions";
import {
  createMessage,
  IMPORT_APPLICATION_MODAL_LABEL,
  IMPORT_APPLICATION_MODAL_TITLE,
  IMPORT_APP_FROM_FILE_MESSAGE,
  IMPORT_APP_FROM_FILE_TITLE,
  IMPORT_APP_FROM_GIT_MESSAGE,
  IMPORT_APP_FROM_GIT_TITLE,
} from "@appsmith/constants/messages";
import FilePickerV2 from "components/ads/FilePickerV2";
import { Colors } from "constants/Colors";
import Text, { TextType } from "components/ads/Text";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import { Theme } from "constants/DefaultTheme";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { setOrgIdForImport } from "actions/applicationActions";
import { GitSyncModalTab } from "entities/GitSync";
import { getIsImportingApplication } from "selectors/applicationSelectors";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

const TextWrapper = styled.div`
  padding-top: ${(props) => props.theme.spaces[7]}px;
  padding-bottom: ${(props) => props.theme.spaces[12] + 2}px;
`;

const Row = styled.div`
  display: flex;
  padding: 0px;
  margin: 0px;
  justify-content: space-between;
`;

const FilePickerWrapper = styled.div`
  width: 320px;
  height: 200px;
  border: 1px solid ${Colors.MERCURY};
  display: flex;
  align-items: center;
  flex-direction: column;
  cursor: pointer;
  position: relative;
  &:hover {
    background: ${Colors.MERCURY};
  }
  & > div {
    background-image: none;
    background: transparent;
    .button-wrapper {
      width: 100%;
      height: 100%;
      .cs-icon {
        border-radius: 50%;
        width: ${(props) => props.theme.spaces[12] + 2}px;
        height: ${(props) => props.theme.spaces[12] + 2}px;
        background: ${Colors.MERCURY};
        display: flex;
        justify-content: center;
        margin-top: 35px;
        margin-bottom: 32px;
        svg {
          width: ${(props) => props.theme.iconSizes.XL}px;
          height: ${(props) => props.theme.iconSizes.XL}px;
        }
      }
      .cs-text {
        max-width: 220px;
        text-align: center;
        margin-top: 0px;
        font-size: ${(props) => props.theme.typography.p1.fontSize}px;
        &.drag-drop-text {
          color: ${Colors.OXFORD_BLUE};
        }
        &.drag-drop-description {
          color: ${Colors.GREY_6};
        }
      }
    }
  }
`;

const CardWrapper = styled.div`
  width: 320px;
  height: 200px;
  border: 1px solid ${Colors.MERCURY};
  display: flex;
  align-items: center;
  flex-direction: column;
  cursor: pointer;
  position: relative;
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
  children?: ReactNode;
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
      {props.children}
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
  const { isModalOpen, onClose, organizationId } = props;
  const [appFileToBeUploaded, setAppFileToBeUploaded] = useState<{
    file: File;
    setProgress: SetProgress;
  } | null>(null);

  const dispatch = useDispatch();
  const onGitImport = useCallback(() => {
    onClose && onClose();
    dispatch({
      type: ReduxActionTypes.GIT_INFO_INIT,
    });
    dispatch(setOrgIdForImport(organizationId));

    dispatch(
      setIsGitSyncModalOpen({
        isOpen: true,
        tab: GitSyncModalTab.GIT_CONNECTION,
      }),
    );

    // dispatch(setIsReconnectingDatasourcesModalOpen({ isOpen: true }));
  }, []);

  const importingApplication = useSelector(getIsImportingApplication);

  const FileUploader = useCallback(
    async (file: File, setProgress: SetProgress) => {
      if (!!file) {
        setAppFileToBeUploaded({
          file,
          setProgress,
        });
        dispatch(
          importApplication({
            orgId: organizationId as string,
            applicationFile: file,
          }),
        );
        onClose && onClose();
      } else {
        setAppFileToBeUploaded(null);
      }
    },
    [],
  );

  useEffect(() => {
    // finished of importing application
    if (appFileToBeUploaded && !importingApplication) {
      setAppFileToBeUploaded(null);
      // should open "Add credential" modal
    }
  }, [appFileToBeUploaded, importingApplication]);

  const onRemoveFile = useCallback(() => setAppFileToBeUploaded(null), []);
  return (
    <StyledDialog
      canOutsideClickClose
      className={"t--import-application-modal"}
      headerIcon={{
        name: "right-arrow",
        bgColor: Colors.GEYSER_LIGHT,
      }}
      isOpen={isModalOpen}
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
        <FilePickerWrapper>
          <FilePickerV2
            containerClickable
            description={createMessage(IMPORT_APP_FROM_FILE_MESSAGE)}
            fileType={FileType.JSON}
            fileUploader={FileUploader}
            onFileRemoved={onRemoveFile}
            title={createMessage(IMPORT_APP_FROM_FILE_TITLE)}
            uploadIcon="file-line"
          />
        </FilePickerWrapper>
        <ImportCard
          handler={onGitImport}
          icon="fork"
          message={createMessage(IMPORT_APP_FROM_GIT_MESSAGE)}
          title={createMessage(IMPORT_APP_FROM_GIT_TITLE)}
        />
      </Row>
    </StyledDialog>
  );
}

export default ImportApplicationModal;
