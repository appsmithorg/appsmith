/* eslint-disable no-console */
import React, { useCallback } from "react";
import styled from "styled-components";
import {
  getIsBackOfficeConnected,
  getIsBackOfficeModalOpen,
} from "selectors/backOfficeSelectors";
import { setIsBackOfficeModalOpen } from "actions/backOfficeActions";

import { Dialog } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";

const Container = styled.div`
  height: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const BodyContainer = styled.div`
  flex: 3;
  height: calc(100% - 15px);
  background-color: gray;
`;

function BackOfficeModal() {
  const dispatch = useDispatch();
  const isModalOpen = useSelector(getIsBackOfficeModalOpen);
  const isBackOfficeConnected = useSelector(getIsBackOfficeConnected);
  console.log("BO connect: ", isBackOfficeConnected);

  const handleClose = useCallback(() => {
    dispatch(setIsBackOfficeModalOpen(false));
  }, [dispatch, setIsBackOfficeModalOpen]);

  return (
    <Dialog
      backdropClassName={isBackOfficeConnected ? "hidden" : ""}
      canEscapeKeyClose
      canOutsideClickClose
      className={isBackOfficeConnected ? "hidden" : ""}
      data-testid="t--back-office-modal"
      isOpen={isModalOpen}
      onClose={handleClose}
      style={{
        width: "1200px",
        height: "calc(100% - 200px);",
        background: "white",
        padding: "1em",
      }}
      title="Connect to BackOffice"
      icon="info-sign"
    >
      <Container>
        <BodyContainer>
          <iframe
            style={{
              width: "100%",
              height: "100%",
            }}
            src="https://backoffice.staging.manabie.io/architecture/configuration"
          />
        </BodyContainer>
      </Container>
    </Dialog>
  );
}

export default BackOfficeModal;
