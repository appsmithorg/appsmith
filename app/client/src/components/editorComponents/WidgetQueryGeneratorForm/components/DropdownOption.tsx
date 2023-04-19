import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
`;

const LeftSection = styled.div`
  width: calc(100% - 16px);
  display: flex;
`;

const RightSection = styled.div`
  width: 16px;
`;

const IconContainer = styled.div`
  width: 28px;
`;

const Label = styled.div`
  width: calc(100% - 28px);
`;

type Props = {
  label?: string;
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
};

export function DropdownOption(props: Props) {
  const { label, leftIcon, rightIcon } = props;

  return (
    <Container>
      <LeftSection>
        {leftIcon && <IconContainer>{leftIcon}</IconContainer>}
        <Label>{label}</Label>
      </LeftSection>
      {rightIcon && (
        <RightSection>
          <IconContainer>{rightIcon}</IconContainer>
        </RightSection>
      )}
    </Container>
  );
}
