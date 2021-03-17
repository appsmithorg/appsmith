import styled from "styled-components";

export default styled.div`
  background-color: ${(props) => props.theme.colors.propertyPane.bg};
  border-radius: ${(props) => props.theme.radii[0]}px;
  box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.2), 0px 2px 10px rgba(0, 0, 0, 0.1);
  padding: 24px 16px;
  color: ${(props) => props.theme.colors.textOnDarkBG};
  text-transform: capitalize;
`;
