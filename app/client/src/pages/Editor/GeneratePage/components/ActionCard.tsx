import React, { JSXElementConstructor } from "react";
import { IconProps } from "constants/IconConstants";

import { Colors } from "constants/Colors";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";

export const IconWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RoundBg = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 40px;
  background-color: ${Colors.Gallery};
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const DescWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0px;
`;

export const Title = styled.p`
  ${(props) => getTypographyByKey(props, "p1")};
  font-weight: 500;
  color: ${Colors.CODE_GRAY};
  font-size: 14px;
`;

export const SubTitle = styled.p`
  ${(props) => getTypographyByKey(props, "p1")};
  color: ${Colors.GRAY};
`;

const CardWrapper = styled.button`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px 30px 10px;
  cursor: pointer;
  height: 200px;
  width: 320px;
  margin: 0px 10px;
  border: 1px solid ${Colors.MERCURY};
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
  className: string;
};

function ActionCard(props: actionCardProps) {
  const { className, Icon, onClick } = props;
  return (
    <CardWrapper className={className} onClick={onClick}>
      <IconWrapper>
        <RoundBg>
          <Icon color={Colors.GRAY2} height={22} width={22} />
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
