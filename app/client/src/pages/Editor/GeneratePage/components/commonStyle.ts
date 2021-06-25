import { Colors } from "constants/Colors";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";

export const IconWrapper = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const RoundBg = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 50%;
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
  color: ${Colors.OXFORD_BLUE};
`;

export const SubTitle = styled.p`
  ${(props) => getTypographyByKey(props, "p1")};
  color: ${Colors.DARK_GRAY};
`;
