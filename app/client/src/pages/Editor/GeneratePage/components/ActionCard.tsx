import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";
import React, { JSXElementConstructor } from "react";
import styled from "styled-components";
import { IconProps } from "constants/IconConstants";

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

const IconWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RoundBg = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 50%;
  background-color: ${Colors.Gallery};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const DescWrapper = styled.div`
  flex: 1;
`;

const Title = styled.p`
  ${(props) => getTypographyByKey(props, "p1")};
  font-weight: 500;
  color: ${Colors.OXFORD_BLUE};
`;

const SubTitle = styled.p`
  ${(props) => getTypographyByKey(props, "p1")};
  color: ${Colors.DARK_GRAY};
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
        <RoundBg>
          <Icon color={Colors.GRAY2} height={16} width={16} />
        </RoundBg>
      </IconWrapper>
      <DescWrapper>
        <Title>{props.title}</Title>
        <SubTitle>{props.subTitle}</SubTitle>
      </DescWrapper>
    </CardWrapper>
  );
}

export default ActionCard;
