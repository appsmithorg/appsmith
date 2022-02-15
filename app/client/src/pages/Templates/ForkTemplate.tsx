import React, { ReactNode, useState } from "react";
import Dialog from "components/ads/DialogComponent";
import Dropdown from "components/ads/Dropdown";
import Button, { Category, Size } from "components/ads/Button";
import { useSelector } from "react-redux";
import { getForkableOrganizations } from "selectors/templatesSelectors";
import styled from "styled-components";
import { Classes } from "@blueprintjs/core";

const ButtonsWrapper = styled.div`
  display: flex;
  margin-top: 24px;
  gap: 10px;
  justify-content: flex-end;
`;

const StyledDropdown = styled(Dropdown)``;

const StyledDialog = styled(Dialog)`
  && .${Classes.DIALOG_BODY} {
    padding-top: 24px;
  }
`;

interface ForkTemplateProps {
  children: ReactNode;
  showForkModal: boolean;
  onClose: () => void;
  templateId: string;
}

function ForkTemplate({ children, onClose, showForkModal }: ForkTemplateProps) {
  const organizationList = useSelector(getForkableOrganizations);
  const [selectedOrganization, setSelectedOrganization] = useState(
    organizationList[0],
  );

  const onFork = () => {
    // dispatch(
    //   importTemplateToOrganisation(templateId, selectedOrganization.value),
    // );
    onClose();
  };

  return (
    <StyledDialog
      canOutsideClickClose
      headerIcon={{ name: "fork", bgColor: "#E7E7E7" }}
      isOpen={showForkModal}
      onClose={onClose}
      title="Choose where to fork the Template"
      trigger={children}
    >
      <StyledDropdown
        dropdownMaxHeight={"200px"}
        fillOptions
        onSelect={(_value, dropdownOption) =>
          setSelectedOrganization(dropdownOption)
        }
        options={organizationList}
        placeholder={"Select Organization"}
        selected={selectedOrganization}
        showLabelOnly
        width={"100%"}
      />
      <ButtonsWrapper>
        <Button
          category={Category.tertiary}
          onClick={onClose}
          size={Size.large}
          text="Cancel"
          type="button"
        />
        <Button
          onClick={onFork}
          size={Size.large}
          text="FORK TEMPLATE"
          type="button"
        />
      </ButtonsWrapper>
    </StyledDialog>
  );
}

ForkTemplate.defaultProps = {
  templateId: "620b83e770a9752ffb1ad2db",
};

export default ForkTemplate;
