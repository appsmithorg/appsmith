import styled from "styled-components";
import { Colors } from "constants/Colors";
import { Layers } from "constants/Layers";

const Container = styled.div`
  background: ${Colors.WHITE};
  width: 250px;
  position: fixed;
  left: 0;
  top: ${(props) => props.theme.smallHeaderHeight};
  z-index: ${Layers.appComments};
  height: calc(100% - ${(props) => props.theme.smallHeaderHeight});
  display: flex;
  flex-direction: column;
`;

export default Container;
