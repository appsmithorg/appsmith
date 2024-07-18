import { Input } from "design-system";
import React from "react";
import styled from "styled-components";

const FormContainer = styled.div`
  margin-top: 20px;
`;

interface Props {
  setBuildingBlockName: (buildingBlockName: string) => void;
  setBuildingBlockIcon: (buildingBlockIcon: string) => void;
  buildingBlockName: string;
  buildingBlockIconURL: string;
}

export const BuildingBlockInfoForm = ({
  buildingBlockIconURL,
  buildingBlockName,
  setBuildingBlockIcon,
  setBuildingBlockName,
}: Props) => {
  return (
    <FormContainer>
      <Input
        data-testid="t--create-building-block-name-input"
        errorMessage={
          buildingBlockName.length > 0 ? "" : "Building block name required"
        }
        isRequired
        label={"Enter a name for the building block"}
        labelPosition="top"
        onChange={setBuildingBlockName}
        placeholder={"Enter a name for the building block"}
        renderAs="input"
        size="md"
        type="text"
        value={buildingBlockName}
      />

      <Input
        data-testid="t--create-building-block-icon-input"
        errorMessage={
          buildingBlockIconURL.length > 0
            ? ""
            : "Building block Icon URL required"
        }
        isRequired
        label={"Enter a name for the building block"}
        labelPosition="top"
        onChange={setBuildingBlockIcon}
        placeholder={"Enter a URL for the building block Icon"}
        renderAs="input"
        size="md"
        type="text"
        value={buildingBlockIconURL}
      />
    </FormContainer>
  );
};
