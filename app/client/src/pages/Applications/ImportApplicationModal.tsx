import React, { useCallback, useState } from "react";
import styled from "styled-components";
import Button, { Size } from "components/ads/Button";
import { StyledDialog } from "./ForkModalStyles";
import { useSelector } from "store";
import { AppState } from "reducers";
import FilePicker, { SetProgress, FileType } from "components/ads/FilePicker";
import { useDispatch } from "react-redux";
import { importApplication } from "actions/applicationActions";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import { IMPORT_APPLICATION_MODAL_TITLE } from "constants/messages";

const ImportButton = styled(Button)<{ disabled?: boolean }>`
  height: 30px;
  width: 81px;
  pointer-events: ${(props) => (!!props.disabled ? "none" : "auto")};
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const FilePickerWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

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

  const importingApplication = useSelector(
    (state: AppState) => state.ui.applications.importingApplication,
  );

  const FileUploader = useCallback(
    async (file: File, setProgress: SetProgress) => {
      if (!!file) {
        setAppFileToBeUploaded({
          file,
          setProgress,
        });
      } else {
        setAppFileToBeUploaded(null);
      }
    },
    [],
  );

  const onImportApplication = useCallback(() => {
    if (!appFileToBeUploaded) {
      Toaster.show({
        text: "Please choose a valid application file!",
        variant: Variant.danger,
      });
      return;
    }
    const { file } = appFileToBeUploaded || {};

    dispatch(
      importApplication({
        orgId: organizationId as string,
        applicationFile: file,
      }),
    );
  }, [appFileToBeUploaded, organizationId]);

  const onRemoveFile = useCallback(() => setAppFileToBeUploaded(null), []);

  return (
    <StyledDialog
      canOutsideClickClose
      className={"t--import-application-modal"}
      isOpen={isModalOpen}
      maxHeight={"540px"}
      setModalClose={onClose}
      title={IMPORT_APPLICATION_MODAL_TITLE()}
    >
      <FilePickerWrapper>
        <FilePicker
          delayedUpload
          fileType={FileType.JSON}
          fileUploader={FileUploader}
          onFileRemoved={onRemoveFile}
        />
      </FilePickerWrapper>
      <ButtonWrapper>
        <ImportButton
          // category={ButtonCategory.tertiary}
          cypressSelector={"t--org-import-app-button"}
          disabled={!appFileToBeUploaded}
          isLoading={importingApplication}
          onClick={onImportApplication}
          size={Size.large}
          text={"IMPORT"}
        />
      </ButtonWrapper>
    </StyledDialog>
  );
}

export default ImportApplicationModal;
