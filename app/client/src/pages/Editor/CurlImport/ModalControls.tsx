import React, { type ReactNode, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getIsCurlModalOpen,
  getIsImportingCurl,
} from "selectors/curlImportSelectors";
import { submit } from "redux-form";
import { CURL_IMPORT_FORM } from "ee/constants/forms";
import { closeCurlImportModal, openCurlImportModal } from "./helpers";
import CurlLogo from "assets/images/Curl-logo.svg";
import { createMessage, IMPORT_BTN_LABEL } from "ee/constants/messages";
import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@appsmith/ads";
import styled from "styled-components";

const ActionButtons = styled.div`
  justify-self: flex-end;
  display: flex;
  align-items: center;

  button:last-child {
    margin-left: ${(props) => props.theme.spaces[7]}px;
  }
`;

const CurlIconWrapper = styled.div`
  width: 24px;
  height: 24px;
  margin-right: ${(props) => props.theme.spaces[3]}px;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.theme.spaces[1]}px;
`;

const CurlImportText = styled.p`
  max-width: 100%;
  flex: 0 1 auto;
  font-size: 17px;
  font-weight: 500;
  color: var(--ads-v2-color-fg);
  line-height: 22px;
  letter-spacing: -0.204px;
`;

const ModalControls = (props: { children: ReactNode }) => {
  const dispatch = useDispatch();

  const isCurlModalOpen = useSelector(getIsCurlModalOpen);

  const isImportingCurl = useSelector(getIsImportingCurl);
  const handleSubmit = useCallback(() => {
    dispatch(submit(CURL_IMPORT_FORM));
  }, [dispatch]);

  const handleModalOpenChange = useCallback(
    (modalState: boolean) => {
      if (modalState) {
        dispatch(openCurlImportModal());
      } else {
        dispatch(closeCurlImportModal());
      }
    },
    [dispatch],
  );

  return (
    <Modal onOpenChange={handleModalOpenChange} open={isCurlModalOpen}>
      <ModalContent>
        <ModalHeader>
          {/*@ts-expect-error Fix this the next time the file is edited*/}
          <Flex direction="column">
            <CurlIconWrapper>
              <img alt="CURL" src={CurlLogo} />
            </CurlIconWrapper>
            <CurlImportText className="text">Import from CURL</CurlImportText>
          </Flex>
        </ModalHeader>
        <ModalBody>{props.children}</ModalBody>
        <ModalFooter>
          <ActionButtons className="t--formActionButtons">
            <Button
              className="t--importBtn"
              isLoading={isImportingCurl}
              onClick={handleSubmit}
              size="md"
            >
              {createMessage(IMPORT_BTN_LABEL)}
            </Button>
          </ActionButtons>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModalControls;
