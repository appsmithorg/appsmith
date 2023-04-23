import type { ReactNode } from "react";
import React, { useCallback, useEffect, useState } from "react";
import styled, { useTheme, css } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  importApplication,
  setWorkspaceIdForImport,
} from "@appsmith/actions/applicationActions";
import {
  createMessage,
  IMPORT_APP_FROM_FILE_MESSAGE,
  IMPORT_APP_FROM_FILE_TITLE,
  IMPORT_APP_FROM_GIT_MESSAGE,
  IMPORT_APP_FROM_GIT_TITLE,
  IMPORT_APPLICATION_MODAL_LABEL,
  IMPORT_APPLICATION_MODAL_TITLE,
  UPLOADING_APPLICATION,
  UPLOADING_JSON,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";
import type { SetProgress } from "design-system-old";
import { FilePickerV2, FileType } from "design-system-old";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import { getIsImportingApplication } from "@appsmith/selectors/applicationSelectors";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import Statusbar from "pages/Editor/gitSync/components/Statusbar";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { Theme } from "constants/DefaultTheme";
import { Icon, Modal, ModalContent, ModalHeader, Text } from "design-system";

const TextWrapper = styled.div`
  padding: 0;
  margin-bottom: ${(props) => props.theme.spaces[12] + 4}px;
  margin-top: ${(props) => props.theme.spaces[11]}px;
`;

const Row = styled.div`
  display: flex;
  padding: 0;
  margin: 0;
  justify-content: center;
  gap: 16px;
`;

const CardStyles = css`
  width: 320px;
  height: 200px;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  display: flex;
  align-items: center;
  flex-direction: column;
  cursor: pointer;
  position: relative;

  &:hover {
    background: var(--ads-v2-color-bg-subtle);
  }
`;

const FileImportCard = styled.div`
  ${CardStyles}
  & > div {
    background: transparent none;

    .upload-form-container {
      padding-top: 0;
    }

    .button-wrapper {
      width: 100%;
      height: 100%;
      justify-content: flex-start;

      .cs-icon {
        border-radius: 50%;
        width: ${(props) => props.theme.spaces[12] + 2}px;
        height: ${(props) => props.theme.spaces[12] + 2}px;
        background: var(--ads-v2-color-bg-muted);
        display: flex;
        justify-content: center;
        margin-top: 35px;
        margin-bottom: 32px;
        color: ${Colors.GREY_800} !important;

        svg {
          width: ${(props) => props.theme.iconSizes.XL}px;
          height: ${(props) => props.theme.iconSizes.XL}px;

          path {
            color: ${Colors.GREY_800} !important;
          }
        }
      }

      .cs-text {
        max-width: 220px;
        text-align: center;
        margin-top: 0;
        font-size: ${(props) => props.theme.typography.p1.fontSize}px;

        &.drag-drop-text {
          color: var(--ads-v2-color-fg);
        }

        &.drag-drop-description {
          color: var(--ads-v2-color-fg-muted);
        }
      }
    }
  }
`;

const CardWrapper = styled.div`
  ${CardStyles}
  .ads-v2-icon {
    border-radius: 50%;
    width: 32px;
    height: 32px;
    background: var(--ads-v2-color-bg-muted);
    display: flex;
    justify-content: center;
    margin-top: 35px;
    margin-bottom: 32px;
  }

  .ads-v2-text {
    max-width: 250px;
    text-align: center;
  }

  .ads-v2-text:last-child {
    color: var(--ads-v2-color-fg-muted);
  }
`;

const StatusbarWrapper = styled.div`
  width: 252px;
  height: 199px;
  .cs-icon {
    margin: auto;
    border-radius: var(--ads-v2-border-radius-circle);
    width: 32px;
    height: 32px;
    display: flex;
    justify-content: center;
    margin-bottom: 8px;
    background: var(--appsmith-color-black-200);
    svg {
      width: 20px;
      height: 20px;
    }
  }
  .ads-v2-text.importing-app-name {
    display: flex;
    justify-content: center;
  }
`;

function GitImportCard(props: { children?: ReactNode; handler?: () => void }) {
  const theme = useTheme() as Theme;
  const onClick = useCallback(() => {
    AnalyticsUtil.logEvent("GS_IMPORT_VIA_GIT_CARD_CLICK");
    props.handler && props.handler();
  }, []);
  const message = createMessage(IMPORT_APP_FROM_GIT_MESSAGE);
  const title = createMessage(IMPORT_APP_FROM_GIT_TITLE);
  return (
    <CardWrapper onClick={onClick}>
      <Icon name={"fork"} size="md" />
      <Text kind="body-m" style={{ marginBottom: theme.spaces[4] }}>
        {title}
      </Text>
      <Text kind="body-m">{message}</Text>
      {props.children}
    </CardWrapper>
  );
}

type ImportApplicationModalProps = {
  workspaceId?: string;
  isModalOpen?: boolean;
  onClose?: () => void;
};

function ImportApplicationModal(props: ImportApplicationModalProps) {
  const { isModalOpen, onClose, workspaceId } = props;
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
    dispatch(setWorkspaceIdForImport(workspaceId));

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
            workspaceId: workspaceId as string,
            applicationFile: file,
          }),
        );
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
      onClose && onClose();
      // should open "Add credential" modal
    }
  }, [appFileToBeUploaded, importingApplication]);

  const onRemoveFile = useCallback(() => setAppFileToBeUploaded(null), []);

  const handleModalClose = (open: boolean) => {
    if (!open) {
      onClose && onClose();
    }
  };

  return (
    <Modal onOpenChange={handleModalClose} open={isModalOpen}>
      <ModalContent
        className={"t--import-application-modal"}
        style={{ width: "fit-content" }}
      >
        <ModalHeader>
          {createMessage(IMPORT_APPLICATION_MODAL_TITLE)}
        </ModalHeader>
        <TextWrapper>
          <Text kind="body-m">
            {createMessage(
              importingApplication
                ? UPLOADING_JSON
                : IMPORT_APPLICATION_MODAL_LABEL,
            )}
          </Text>
        </TextWrapper>
        {!importingApplication && (
          <Row>
            <FileImportCard className="t--import-json-card">
              <FilePickerV2
                containerClickable
                description={createMessage(IMPORT_APP_FROM_FILE_MESSAGE)}
                fileType={FileType.JSON}
                fileUploader={FileUploader}
                iconFillColor={Colors.GREY_800}
                onFileRemoved={onRemoveFile}
                title={createMessage(IMPORT_APP_FROM_FILE_TITLE)}
                uploadIcon="file-line"
              />
            </FileImportCard>
            <GitImportCard handler={onGitImport} />
          </Row>
        )}
        {importingApplication && (
          <Row className="t-import-app-progress-wrapper">
            <StatusbarWrapper className="t--importing-app-statusbar">
              <Icon name="file-line" size="md" />
              <Text className="importing-app-name" kind="body-m">
                {appFileToBeUploaded?.file?.name || "filename.json"}
              </Text>
              <Statusbar
                completed={!importingApplication}
                message={createMessage(UPLOADING_APPLICATION)}
                period={4}
              />
            </StatusbarWrapper>
          </Row>
        )}
      </ModalContent>
    </Modal>
  );
}

export default ImportApplicationModal;
