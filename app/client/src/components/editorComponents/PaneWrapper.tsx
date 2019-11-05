import styled from "styled-components";

export default styled.div`
  background-color: ${props => props.theme.colors.paneBG};
  border-radius: ${props => props.theme.radii[1]}px;
  box-shadow: 0px 0px 3px ${props => props.theme.colors.paneBG};
  padding: 24px 16px;
  color: ${props => props.theme.colors.textOnDarkBG};
  text-transform: capitalize;
`;
