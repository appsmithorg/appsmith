import React, { useState } from "react";
import styled from "styled-components";
import { Size } from "components/ads/Button";
import { StyledDialog, ForkButton, ButtonWrapper } from "./ForkModalStyles";
import Checkbox from "components/ads/Checkbox";
import { useSelector } from "store";
import { AppState } from "reducers";
import Text, { TextType } from "components/ads/Text";

const CheckboxDiv = styled.div`
  // overflow: auto;
  max-height: 250px;
  margin-bottom: 10px;
  margin-top: 20px;
`;

type ExportApplicationModalProps = {
  export?: (
    applicationId: string,
    applicationName: string,
    callback: () => void,
  ) => void;
  applicationId?: string;
  applicationName?: string;
  organizationId?: string;
  isModalOpen?: boolean;
  setModalClose?: (isOpen: boolean) => void;
};

function ExportApplicationModal(props: ExportApplicationModalProps) {
  const { setModalClose, isModalOpen } = props;
  const onExportSuccess = () => {
    setModalClose && setModalClose(false);
  };
  const exportApplication = () => {
    props.export &&
      props.applicationId &&
      props.applicationName &&
      props.export(props.applicationId, props.applicationName, onExportSuccess);
  };

  const exportingApplication = useSelector(
    (state: AppState) => state.ui.applications.exportingApplication,
  );

  const [isChecked, setIsCheckedToTrue] = useState(false);
  return (
    <StyledDialog
      canOutsideClickClose
      className={"fork-modal"}
      isOpen={isModalOpen}
      maxHeight={"540px"}
      setModalClose={setModalClose}
      title={"Be sure to read the data policy"}
    >
      <CheckboxDiv>
        <Text type={TextType.P1}>
          <Checkbox
            label="By clicking on this you agree that your application credentials can be stored inside a file"
            onCheckChange={(checked: boolean) => {
              setIsCheckedToTrue(checked);
            }}
          />
        </Text>
      </CheckboxDiv>
      <ButtonWrapper>
        <ForkButton
          cypressSelector={"t--export-app-button"}
          disabled={!isChecked}
          isLoading={exportingApplication}
          onClick={exportApplication}
          size={Size.large}
          text={"EXPORT"}
        />
      </ButtonWrapper>
    </StyledDialog>
  );
}

export default ExportApplicationModal;
