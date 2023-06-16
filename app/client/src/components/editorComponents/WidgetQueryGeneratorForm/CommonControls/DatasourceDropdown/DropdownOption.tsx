import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  width: calc(100% - 10px);
  height: 100%;
`;

const LeftSection = styled.div`
  width: calc(100% - 16px);
  display: flex;
  align-items: center;
`;

const IconContainer = styled.div`
  width: 24px;
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
  className?: string;
};

export function DropdownOption(props: Props) {
  const { className, label, leftIcon, rightIcon } = props;

  return (
    <Container className={className}>
      <LeftSection>
        {leftIcon && <IconContainer>{leftIcon}</IconContainer>}
        <Label>{label}</Label>
      </LeftSection>
      {rightIcon && <IconContainer>{rightIcon}</IconContainer>}
    </Container>
  );
}
