import { ButtonVariantTypes } from "components/constants";
import { noop } from "lodash";
import React from "react";
import styled from "styled-components";
import ButtonComponent, { ButtonType } from "widgets/ButtonWidget/component";

const Wrapper = styled.div`
  display: flex;
  padding: 3px 0px;
  justify-content: end;
  position: absolute;
  width: 100%;
  background: #fff;
  z-index: 1;
`;

const StyledButton = styled(ButtonComponent)`
  width: 100px;
  margin: 0px 8px;
`;

type EditActionsProps = {
  onDiscard: () => void;
  onSave: () => void;
};

export function EditActions(props: EditActionsProps) {
  return (
    <Wrapper>
      <StyledButton
        clickWithRecaptcha={noop}
        isLoading={false}
        onClick={props.onSave}
        text="Save"
        type={ButtonType.BUTTON}
        widgetId=""
      />
      <StyledButton
        buttonVariant={ButtonVariantTypes.SECONDARY}
        clickWithRecaptcha={noop}
        isLoading={false}
        onClick={props.onDiscard}
        text="Discard"
        type={ButtonType.BUTTON}
        widgetId=""
      />
    </Wrapper>
  );
}
