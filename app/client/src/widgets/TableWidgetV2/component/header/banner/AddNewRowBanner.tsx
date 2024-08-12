import { ButtonVariantTypes } from "components/constants";
import styled from "styled-components";
import React, { useState } from "react";
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
  onAddNewRowAction: (
    type: AddNewRowActions,
    onActionComplete: () => void,
  ) => void;
  disabledAddNewRowSave: boolean;
}

function AddNewRowBannerComponent(props: AddNewRowBannerType) {
  const [isDiscardLoading, setIsDiscardLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);

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
          disabled={isSaveLoading}
          loading={isDiscardLoading}
          onClick={() => {
            setIsDiscardLoading(true);
            props.onAddNewRowAction(AddNewRowActions.DISCARD, () =>
              setIsDiscardLoading(false),
            );
          }}
          text="Discard"
        />
        <BaseButton
          borderRadius={props.borderRadius}
          boxShadow={props.boxShadow}
          buttonColor={props.accentColor}
          buttonVariant={ButtonVariantTypes.PRIMARY}
          className="t--save-new-row"
          disabled={props.disabledAddNewRowSave || isDiscardLoading}
          loading={isSaveLoading}
          onClick={(event) => {
            event.stopPropagation();
            setIsSaveLoading(true);
            props.onAddNewRowAction(AddNewRowActions.SAVE, () =>
              setIsSaveLoading(false),
            );
          }}
          text="Save row"
        />
      </ActionContainer>
    </Container>
  );
}
export const AddNewRowBanner = React.memo(AddNewRowBannerComponent);
