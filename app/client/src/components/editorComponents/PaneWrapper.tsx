import styled from "styled-components";
import { Colors } from "constants/Colors";

export default styled.div`
  background-color: ${Colors.GREY_1};
  border-radius: ${(props) => props.theme.radii[0]}px;
  box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.2), 0px 2px 10px rgba(0, 0, 0, 0.1);
  color: ${(props) => props.theme.colors.textOnDarkBG};
  text-transform: capitalize;
`;
