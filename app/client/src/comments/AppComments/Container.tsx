import styled from "styled-components";
import { Colors } from "constants/Colors";

const Container = styled.div`
  background: ${Colors.WHITE};
  width: 250px;
  position: fixed;
  left: 0;
  top: ${(props) => props.theme.smallHeaderHeight};
  z-index: 11;
  height: calc(100% - ${(props) => props.theme.smallHeaderHeight});
  display: flex;
  flex-direction: column;
`;

export default Container;
