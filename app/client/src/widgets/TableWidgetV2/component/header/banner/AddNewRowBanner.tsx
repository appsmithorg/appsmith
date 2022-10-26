import { ButtonVariantTypes } from "components/constants";
import styled from "constants/DefaultTheme";
import React from "react";
import { BaseButton } from "widgets/ButtonWidget/component";
import { AddNewRowActions } from "../../Constants";

const Container = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 16px;
`;

const ActionContainer = styled.div`
  display: flex;

  > * {
    margin: 0 5px;
    width: 112px;
  }
`;

export interface AddNewRowBannerType {
  accentColor: string;
  borderRadius: string;
  boxShadow: string;
  onAddNewRowAction: (type: AddNewRowActions) => void;
  disabledAddNewRowSave: boolean;
}

export function AddNewRowBanner(props: AddNewRowBannerType) {
  return (
    <Container>
      <Title>Add New Row</Title>
      <ActionContainer>
        <BaseButton
          borderRadius={props.borderRadius}
          boxShadow={props.boxShadow}
          buttonColor={props.accentColor}
          buttonVariant={ButtonVariantTypes.SECONDARY}
          className="t--discard-new-row"
          onClick={() => props.onAddNewRowAction(AddNewRowActions.DISCARD)}
          text="Discard"
        />
        <BaseButton
          borderRadius={props.borderRadius}
          boxShadow={props.boxShadow}
          buttonColor={props.accentColor}
          buttonVariant={ButtonVariantTypes.PRIMARY}
          className="t--save-new-row"
          disabled={props.disabledAddNewRowSave}
          onClick={() => props.onAddNewRowAction(AddNewRowActions.SAVE)}
          text="Save row"
        />
      </ActionContainer>
    </Container>
  );
}
