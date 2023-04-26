import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  width: calc(100% - 10px);
`;

const LeftSection = styled.div`
  width: calc(100% - 16px);
  display: flex;
  align-items: center;
`;

const RightSection = styled.div`
  width: 16px;
`;

const IconContainer = styled.div`
  width: 30px;
  display: flex;
`;

const Label = styled.div`
  width: calc(100% - 40px);
  overflow: hidden;
  text-overflow: ellipsis;
`;

type Props = {
  label?: JSX.Element | string;
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
