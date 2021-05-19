import React, { useState } from "react";
import styled from "styled-components";
import { Size } from "components/ads/Button";
import { StyledDialog, ForkButton, ButtonWrapper } from "./ForkModalStyles";
import Checkbox from "components/ads/Checkbox";
import { useSelector } from "store";
import { AppState } from "reducers";
import Text, { TextType } from "components/ads/Text";
import FilePicker, {
  SetProgress,
  UploadCallback,
} from "components/ads/FilePicker";
import { useDispatch } from "react-redux";
import { importApplication } from "actions/orgActions";

const CheckboxDiv = styled.div`
  overflow: auto;
  max-height: 250px;
  margin-bottom: 10px;
  margin-top: 20px;
`;

type ImportApplicationModalProps = {
  // import?: (file: any) => void;
  organizationId?: string;
  isModalOpen?: boolean;
  onClose?: () => void;
};

function ImportApplicationModal(props: ImportApplicationModalProps) {
  const { onClose, isModalOpen, organizationId } = props;
  const dispatch = useDispatch();
  const onImportSuccess = () => {
    onClose && onClose();
  };

  // const importApplication = () => {
  //   props.organizationId && props.import && props.import("");
  //   onClose && onClose();
  // };
  const importingApplication = useSelector(
    (state: AppState) => state.ui.applications.importingApplication,
  );

  const FileUploader = (
    file: File,
    setProgress: SetProgress,
    // onUpload: UploadCallback,
  ) => {
    const progress = (progressEvent: ProgressEvent) => {
      const uploadPercentage = Math.round(
        (progressEvent.loaded / progressEvent.total) * 100,
      );
      if (uploadPercentage === 100) {
        // onUpload(currentOrg.logoUrl || "");
        console.log("upload success");
      }
      setProgress(uploadPercentage);
    };

    dispatch(
      importApplication({
        orgId: organizationId as string,
        applicationFile: file,
        progress: progress,
      }),
    );
  };

  // const exportedApplication = useSelector(
  //   (state: AppState) => state.ui.applications.exportedApplication,
  // );

  const [isChecked, setIsCheckedToTrue] = useState(false);
  return (
    <StyledDialog
      canOutsideClickClose
      className={"t--import-application-modal"}
      isOpen={isModalOpen}
      maxHeight={"540px"}
      setModalClose={onClose}
      title={"Upload application file"}
    >
      <CheckboxDiv>
        <Text type={TextType.P1}>
          <Checkbox
            label="By clicking on this you agree that your application credentials will be read from the file"
            onCheckChange={(checked: boolean) => {
              setIsCheckedToTrue(checked);
            }}
          />
        </Text>
      </CheckboxDiv>
      <FilePicker
        fileUploader={FileUploader}
        logoUploadError={"file error"}
        onFileRemoved={() => console.log("remove file")}
        // url={currentOrg && currentOrg.logoUrl}
      />
      <ButtonWrapper>
        <ForkButton
          cypressSelector={"t--import-app-button"}
          disabled={!isChecked}
          onClick={() => {
            console.log("upload btn");
          }}
          size={Size.large}
          text={"IMPORT"}
        />
      </ButtonWrapper>
    </StyledDialog>
  );
}

export default ImportApplicationModal;
