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
import {
  IMPORT_APPLICATION_MODAL_TITLE,
  IMPORT_APPLICATION_MODAL_SUB_TITLE,
} from "constants/messages";

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
  const { isModalOpen, onClose, organizationId } = props;
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
  };

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
        />
      </FilePickerWrapper>
      <CheckboxDiv>
        <Text type={TextType.P1}>
          <Checkbox
            cypressSelector={"t--org-import-app-confirm"}
            label={IMPORT_APPLICATION_MODAL_SUB_TITLE()}
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
