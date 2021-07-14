import { Colors } from "constants/Colors";
import React, { JSXElementConstructor } from "react";
import styled from "styled-components";
import { IconProps } from "constants/IconConstants";
import { IconWrapper, DescWrapper, Title, SubTitle } from "./commonStyle";

const CardWrapper = styled.button`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  height: 200px;
  width: 350px;
  margin: 0px 10px;
  border: none;
  background-color: ${Colors.WHITE};
  &:hover {
    background-color: ${Colors.Gallery};
  }
`;

type actionCardProps = {
  Icon: JSXElementConstructor<IconProps>;
  onClick: (e: React.MouseEvent) => void;
  subTitle: string;
  title: string;
};

function ActionCard(props: actionCardProps) {
  const { Icon, onClick } = props;
  return (
    <CardWrapper onClick={onClick}>
      <IconWrapper>
        <Icon color={Colors.GRAY2} height={16} width={16} />
      </IconWrapper>
      <DescWrapper>
        <Title>{props.title}</Title>
        <SubTitle>{props.subTitle}</SubTitle>
      </DescWrapper>
    </CardWrapper>
  );
}

export default ActionCard;
