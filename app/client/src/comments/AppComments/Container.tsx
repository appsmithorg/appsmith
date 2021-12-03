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
    height: calc(100% - ${props.theme.smallHeaderHeight} - ${props.theme.bottomBarHeight});
  `
      : `
    position: relative;
  `}
  z-index: ${Layers.appComments};
  display: flex;
  flex-direction: column;
`;

export default Container;
