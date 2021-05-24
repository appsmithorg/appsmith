import React, { useState } from "react";
import styled from "styled-components";
import { Size } from "components/ads/Button";
import { StyledDialog, ForkButton, ButtonWrapper } from "./ForkModalStyles";
import Checkbox from "components/ads/Checkbox";
import { useSelector } from "store";
import { AppState } from "reducers";
import Text, { TextType } from "components/ads/Text";
import FilePicker, { SetProgress, FileType } from "components/ads/FilePicker";
import { useDispatch } from "react-redux";
import { importApplication } from "actions/applicationActions";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";

const CheckboxDiv = styled.div`
  overflow: auto;
  max-height: 250px;
  margin-bottom: 10px;
  margin-top: 20px;
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
  const { onClose, isModalOpen, organizationId } = props;
  const [isChecked, setIsCheckedToTrue] = useState(false);
  const [appFileToBeUploaded, setAppFileToBeUploaded] = useState<{
    file: File;
    setProgress: SetProgress;
  } | null>(null);

  const dispatch = useDispatch();

  const importingApplication = useSelector(
    (state: AppState) => state.ui.applications.importingApplication,
  );

  const FileUploader = async (file: File, setProgress: SetProgress) => {
    if (!!file) {
      setAppFileToBeUploaded({
        file,
        setProgress,
      });
    } else {
      setAppFileToBeUploaded(null);
    }
  };

  const onImportApplication = () => {
    if (!appFileToBeUploaded) {
      Toaster.show({
        text: "Please a valid application file!",
        variant: Variant.danger,
      });
    }
    const { file, setProgress } = appFileToBeUploaded || {};
    const progress = (progressEvent: ProgressEvent) => {
      const uploadPercentage = Math.round(
        (progressEvent.loaded / progressEvent.total) * 100,
      );
      setProgress && setProgress(uploadPercentage);
    };

    dispatch(
      importApplication({
        orgId: organizationId as string,
        applicationFile: file,
        progress: progress,
      }),
    );
  };

  return (
    <StyledDialog
      canOutsideClickClose
      className={"t--import-application-modal"}
      isOpen={isModalOpen}
      maxHeight={"540px"}
      setModalClose={onClose}
      title={"Import Application"}
    >
      <FilePickerWrapper>
        <FilePicker
          fileType={FileType.JSON}
          fileUploader={FileUploader}
          onFileRemoved={() => console.log("remove file")}
        />
      </FilePickerWrapper>
      <CheckboxDiv>
        <Text type={TextType.P1}>
          <Checkbox
            cypressSelector={"t--org-import-app-confirm"}
            label="By clicking on this you agree that your application credentials will be read from the file"
            onCheckChange={(checked: boolean) => {
              setIsCheckedToTrue(checked);
            }}
          />
        </Text>
      </CheckboxDiv>
      <ButtonWrapper>
        <ForkButton
          cypressSelector={"t--org-import-app-button"}
          disabled={!isChecked || !appFileToBeUploaded}
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
