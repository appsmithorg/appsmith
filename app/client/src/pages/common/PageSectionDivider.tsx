import styled from "styled-components";
import { Divider } from "@blueprintjs/core";

export default styled(Divider)`
  margin: ${(props) => props.theme.spaces[11]}px auto;
  width: 100%;
`;
