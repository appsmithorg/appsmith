import styled from "styled-components";

export const Container = styled.div`
  height: calc(100vh - 48px);
  margin-top: 48px;

  .row {
    display: flex;

    :first-child {
      height: 150px;
    }
    :last-child {
      height: calc(100vh - 150px);
    }

    .col-6 {
      width: 50%;
    }

    .preview-window {
      height: calc(100vh - 150px);
    }
  }
`;

export const ButtonContainer = styled.div`
  position: fixed;
  top: 0;
  left: 50%;
  z-index: 10;
  transform: translate(-50%, 0);

  button {
    margin: 10px 30px;
  }
`;
