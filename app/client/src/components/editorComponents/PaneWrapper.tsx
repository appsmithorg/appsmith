import styled from "styled-components";

export default styled.div`
  background-color: ${(props) => props.theme.colors.propertyPane.bg};
  border-radius: ${(props) => props.theme.radii[0]}px;
  box-shadow: 12px 0px 28px rgba(0, 0, 0, 0.32);
  padding: 24px 16px;
  color: ${(props) => props.theme.colors.textOnDarkBG};
  text-transform: capitalize;
`;
