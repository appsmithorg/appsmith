import styled from "styled-components";

export const GridContainer = styled.div`
  display: grid;
  width: 100vw;
  height: 100%;
`;

export const LayoutContainer = styled.div<{ name: string }>`
  position: relative;
  grid-area: ${(props) => props.name};
`;
