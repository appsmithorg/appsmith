import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";

export const ThreadContainer = styled.div`
  border: 1px solid
    ${(props) => props.theme.colors.comments.threadContainerBorder};
  width: 300px;
`;

export const ThreadHeader = styled.div`
  padding: ${(props) => props.theme.spaces[6]}px;
`;

export const ThreadHeaderTitle = styled.div`
  ${(props) => getTypographyByKey(props, "h5")}
  color: ${(props) => props.theme.colors.comments.commentBody};
`;
