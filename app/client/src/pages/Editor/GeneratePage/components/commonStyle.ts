import { Colors } from "constants/Colors";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";

export const IconWrapper = styled.div`
  flex: 1;
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
