import styled from "styled-components";

export const Header = styled.div`
  display: flex;
  padding-bottom: 20px;
  button {
    margin-left: auto;
  }

  & > div {
    display: flex;
    align-items: center;

    h1 {
      margin: 0;
      font-size: 18px;
      color: ${(props) => props.theme.colors.text.heading};
      margin-left: 10px;
    }
  }
`;

export default Header;
