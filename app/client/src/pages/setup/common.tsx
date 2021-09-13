import styled from "styled-components";

export const FormHeaderWrapper = styled.div`
  position: relative;
`;

export const FormHeaderLabel = styled.h5`
  width: 100%;
  font-size: 20px;
  margin: 8px 0 16px;
  font-weight: 500;
`;

export const FormHeaderIndex = styled.h5`
  font-size: 20px;
  font-weight: 500;
  position: absolute;
  left: -33px;
  top: -33px;
`;

export const FormBodyWrapper = styled.div`
  padding: ${(prop) => prop.theme.spaces[10]}px 0px;
`;

export const FormHeaderSubtext = styled.p``;

export const ControlWrapper = styled.div`
  margin: ${(prop) => prop.theme.spaces[6]}px 0px;
`;

export const Label = styled.label`
  display: inline-block;
  margin-bottom: 10px;
`;

export const ButtonWrapper = styled.div`
  margin: ${(prop) => prop.theme.spaces[17] * 2}px 0px 0px;
`;

export const AllowToggleWrapper = styled.div`
  display: flex;
`;

export const AllowToggle = styled.div`
  flex-basis: 68px;
`;

export const AllowToggleLabel = styled.p`
  margin-bottom: 0px;
  margin-top: 2px;
`;

export const StyledLink = styled.a`
  &,
  &:hover {
    color: ${(props) => props.theme.colors.link};
    text-decoration: none;
  }
`;
