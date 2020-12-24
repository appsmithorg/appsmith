import styled from "styled-components";

const MenuDivider = styled.div`
  margin: ${(props) => props.theme.spaces[1]}px
    ${(props) => props.theme.spaces[6]}px;
  border-top: 1px solid ${(props) => props.theme.colors.menuBorder};
`;

export default MenuDivider;
