import { importPartialApplication } from "@appsmith/actions/applicationActions";
import {
  IMPORT_APP_FROM_FILE_MESSAGE,
  IMPORT_APP_FROM_FILE_TITLE,
  PARTIAL_IMPORT_EXPORT,
  UPLOADING_APPLICATION,
  UPLOADING_JSON,
  createMessage,
} from "@appsmith/constants/messages";
import {
  getIsImportingPartialApplication,
  getPartialImportExportLoadingState,
} from "@appsmith/selectors/applicationSelectors";
import { Icon, Modal, ModalContent, ModalHeader, Text } from "design-system";
import type { SetProgress } from "design-system-old";
import { FilePickerV2, FileType } from "design-system-old";
import Statusbar from "pages/Editor/gitSync/components/Statusbar";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { css } from "styled-components";

const TextWrapper = styled.div`
  padding: 0;
  margin-bottom: var(--ads-v2-spaces-7);
`;

const Row = styled.div`
  display: flex;
  padding: 0;
  margin: 0;
  justify-content: center;
  gap: 16px;
`;

const CardStyles = css`
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

const FileImportCard = styled.div<{ fillCardWidth: boolean }>`
  ${CardStyles}
  width: ${(props) => (props.fillCardWidth ? "100%" : "320px")};
  & > div {
    background: transparent none;
    border: none;

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
        color: var(--ads-v2-color-fg) !important;

        svg {
          width: ${(props) => props.theme.iconSizes.XL}px;
          height: ${(props) => props.theme.iconSizes.XL}px;

          path {
            color: var(--ads-v2-color-fg) !important;
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

const StatusbarWrapper = styled.div`
  width: 252px;
  height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

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

interface PartialImportModalProps {
  isModalOpen?: boolean;
  onClose?: () => void;
}

function PartialImportModal(props: PartialImportModalProps) {
  const { isModalOpen, onClose } = props;
  const [appFileToBeUploaded, setAppFileToBeUploaded] = useState<{
    file: File;
    setProgress: SetProgress;
  } | null>(null);

  const dispatch = useDispatch();

  const importingPartialApplication = useSelector(
    getIsImportingPartialApplication,
  );
  const partialImportExportLoadingState = useSelector(
    getPartialImportExportLoadingState,
  );

  const FileUploader = useCallback(
    async (file: File, setProgress: SetProgress) => {
      if (!!file) {
        setAppFileToBeUploaded({
          file,
          setProgress,
        });
        dispatch(
          importPartialApplication({
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
    if (appFileToBeUploaded && partialImportExportLoadingState.isImportDone) {
      setAppFileToBeUploaded(null);
      onClose && onClose();
    }
  }, [appFileToBeUploaded, partialImportExportLoadingState]);

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
        style={{
          width: importingPartialApplication ? "40vw" : "fit-content",
          minWidth: "30vw",
        }}
      >
        <ModalHeader>
          {createMessage(PARTIAL_IMPORT_EXPORT.import.modalHeading)}
        </ModalHeader>
        <TextWrapper>
          <Text kind="body-m">
            {createMessage(
              importingPartialApplication
                ? UPLOADING_JSON
                : PARTIAL_IMPORT_EXPORT.import.modalSubheading,
            )}
          </Text>
        </TextWrapper>
        {!importingPartialApplication && (
          <Row>
            <FileImportCard
              className="t--import-json-card"
              fillCardWidth={false}
            >
              <FilePickerV2
                containerClickable
                description={createMessage(IMPORT_APP_FROM_FILE_MESSAGE)}
                fileType={FileType.JSON}
                fileUploader={FileUploader}
                iconFillColor={"var(--ads-v2-color-fg)"}
                onFileRemoved={onRemoveFile}
                title={createMessage(IMPORT_APP_FROM_FILE_TITLE)}
                uploadIcon="file-line"
              />
            </FileImportCard>
          </Row>
        )}
        {importingPartialApplication && (
          <Row className="t-import-app-progress-wrapper">
            <StatusbarWrapper className="t--importing-app-statusbar">
              <Icon name="file-line" size="md" />
              <Text className="importing-app-name" kind="body-m">
                {appFileToBeUploaded?.file?.name || "filename.json"}
              </Text>
              <Statusbar
                completed={!importingPartialApplication}
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

export default PartialImportModal;
