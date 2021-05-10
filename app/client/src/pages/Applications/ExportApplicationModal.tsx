import React, { useState } from "react";
import styled from "styled-components";
import { Size } from "components/ads/Button";
import { StyledDialog, ForkButton, ButtonWrapper } from "./ForkModalStyles";
import Checkbox from "components/ads/Checkbox";
import Text, { TextType } from "components/ads/Text";

const CheckboxDiv = styled.div`
  overflow: auto;
  max-height: 250px;
  margin-bottom: 10px;
  margin-top: 20px;
`;

type ExportApplicationModalProps = {
  export: (applicationId: string) => void;
  applicationId: string;
  isModalOpen?: boolean;
  setModalClose?: (isOpen: boolean) => void;
};

function ExportApplicationModal(props: ExportApplicationModalProps) {
  const { setModalClose, isModalOpen } = props;
  const exportApplication = () => {
    props.export(props.applicationId);
  };

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
          cypressSelector={"t--fork-app-to-org-button"}
          disabled={!isChecked}
          onClick={exportApplication}
          size={Size.large}
          text={"EXPORT"}
        />
      </ButtonWrapper>
    </StyledDialog>
  );
}

export default ExportApplicationModal;
