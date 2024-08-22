import {
  backgrounds,
  borders,
  compose,
  effects,
  flexboxGrids,
  flexboxes,
  grids,
  interactivity,
  layout,
  sizing,
  space,
  transforms,
} from "@xstyled/system";
import styled from "styled-components";

import { height, width } from "../__config__/utils";

const customSystem = compose(
  backgrounds,
  borders,
  effects,
  interactivity,
  layout,
  sizing,
  space,
  transforms,
  width,
  height,
  flexboxes,
  flexboxGrids,
  grids,
);

export const StyledBox = styled.div`
  ${customSystem}
`;
