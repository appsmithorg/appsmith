import React, { ReactNode, useState } from "react";
import Dialog from "components/ads/DialogComponent";
import Dropdown from "components/ads/Dropdown";
import Button, { Category, Size } from "components/ads/Button";
import { useDispatch, useSelector } from "react-redux";
import { noop } from "lodash";
import {
  getForkableOrganizations,
  isImportingTemplateSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import { importTemplateToOrganisation } from "actions/templateActions";

const ButtonsWrapper = styled.div`
  display: flex;
  margin-top: 24px;
  gap: 10px;
  justify-content: flex-end;
`;

interface ForkTemplateProps {
  children: ReactNode;
  showForkModal: boolean;
  onClose: () => void;
  templateId: string;
}

function ForkTemplate({
  children,
  onClose,
  showForkModal,
  templateId,
}: ForkTemplateProps) {
  const organizationList = useSelector(getForkableOrganizations);
  const [selectedOrganization, setSelectedOrganization] = useState(
    organizationList[0],
  );
  const isImportingTemplate = useSelector(isImportingTemplateSelector);
  const dispatch = useDispatch();
  const onFork = () => {
    dispatch(
      importTemplateToOrganisation(templateId, selectedOrganization.value),
    );
  };

  return (
    <Dialog
      canOutsideClickClose={!isImportingTemplate}
      headerIcon={{ name: "fork", bgColor: "#E7E7E7" }}
      isOpen={showForkModal}
      onClose={isImportingTemplate ? noop : onClose}
      title="Choose where to fork the Template"
      trigger={children}
    >
      <Dropdown
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
          disabled={isImportingTemplate}
          onClick={onClose}
          size={Size.large}
          text="Cancel"
          type="button"
        />
        <Button
          isLoading={isImportingTemplate}
          onClick={onFork}
          size={Size.large}
          text="FORK TEMPLATE"
          type="button"
        />
      </ButtonsWrapper>
    </Dialog>
  );
}

ForkTemplate.defaultProps = {
  templateId: "620b83e770a9752ffb1ad2db",
};

export default ForkTemplate;
