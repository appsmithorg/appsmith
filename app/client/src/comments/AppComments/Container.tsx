import styled from "styled-components";
import { Colors } from "constants/Colors";
import { Layers } from "constants/Layers";

const Container = styled.div<{ isInline?: boolean }>`
  background: ${Colors.WHITE};
  width: 250px;
  ${(props) =>
    !props.isInline
      ? `
    position: fixed;
    left: 0;
    top: ${props.theme.smallHeaderHeight};
  `
      : `
    position: unset;
  `}
  z-index: ${Layers.appComments};
  height: calc(100% - ${(props) => props.theme.smallHeaderHeight});
  display: flex;
  flex-direction: column;
`;

export default Container;
