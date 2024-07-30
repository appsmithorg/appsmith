import styled from "styled-components";
import {
  compose,
  backgrounds,
  borders,
  effects,
  interactivity,
  layout,
  sizing,
  space,
  transforms,
  flexboxes,
  flexboxGrids,
  grids,
} from "@xstyled/system";
import { width, height } from "../__config__/utils";

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
