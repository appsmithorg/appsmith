import type { ReactNode } from "react";
import React, { useState } from "react";
import styled from "styled-components";
import _, { noop } from "lodash";
import {
  Button,
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader,
  SearchInput,
  ModalFooter,
} from "design-system";
import { useDispatch, useSelector } from "react-redux";
import {
  getDeletingMultipleApps,
  getIsFetchingApplications,
} from "@appsmith/selectors/applicationSelectors";
import { Indices } from "constants/Layers";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  DELETING_MULTIPLE_APPLICATION_MODAL_DESC,
  DELETING_MULTIPLE_APPLICATION_MODAL_TITLE,
  createMessage,
} from "@appsmith/constants/messages";

const SubHeaderWrapper = styled.div<{
  isMobile?: boolean;
  isBannerVisible?: boolean;
}>`
  width: 100%;
  display: flex;
  justify-content: space-between;
  ${(props) => (props.isBannerVisible ? "margin-top: 96px" : "")};
  background: var(--ads-v2-color-bg);
  z-index: ${({ isMobile }) => (isMobile ? Indices.Layer8 : Indices.Layer9)};
  ${({ isMobile }) =>
    isMobile
      ? "padding: 12px 16px; margin: 0px;"
      : "padding: var(--ads-v2-spaces-7) 0; position: sticky; top: 0; align-items: center;"}
`;
const SearchContainer = styled.div<{
  isMobile?: boolean;
}>`
  width: ${({ isMobile }) => (isMobile ? `100%` : `250px`)};
`;

const MultipleDeleteWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

type SubHeaderProps = {
  add?: {
    form: ReactNode;
    title: string;
    formName: string;
    isAdding: boolean;
    formSubmitIntent: string;
    errorAdding?: string;
    formSubmitText: string;
    onClick: () => void;
  };
  search?: {
    placeholder: string;
    debounce?: boolean;
    queryFn?: (keyword: string) => void;
    defaultValue?: string;
  };
  isBannerVisible?: boolean;
};

export function ApplicationsSubHeader(props: SubHeaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isMobile = useIsMobileDevice();
  const query =
    props.search &&
    props.search.queryFn &&
    _.debounce(props.search.queryFn, 250, { maxWait: 1000 });

  const dispatch = useDispatch();

  const deleteMultipleApplicationObject = useSelector(getDeletingMultipleApps);

  const handleMultipleDelete = () => {
    dispatch({
      type: ReduxActionTypes.DELETE_MULTIPLE_APPS_INIT,
    });
  };
  const handleCancelMultipleDelete = () => {
    dispatch({
      type: ReduxActionTypes.DELETE_MULTIPLE_APPLICATION_CANCEL,
    });
  };
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setShowConfirmationModal(false);
      handleCancelMultipleDelete();
    }
  };

  return (
    <SubHeaderWrapper
      isBannerVisible={props.isBannerVisible}
      isMobile={isMobile}
    >
      <SearchContainer isMobile={isMobile}>
        {props.search && (
          <SearchInput
            data-testid="t--application-search-input"
            defaultValue={props.search.defaultValue}
            isDisabled={isFetchingApplications}
            onChange={query || noop}
            placeholder={props.search.placeholder}
          />
        )}
      </SearchContainer>

      {!!deleteMultipleApplicationObject.list?.length && (
        <MultipleDeleteWrapper>
          <Button
            isLoading={deleteMultipleApplicationObject.isDeleting}
            onClick={() => setShowConfirmationModal(true)}
            size="sm"
            startIcon="delete-bin-line"
          >
            Delete
          </Button>
          <Button
            kind="secondary"
            onClick={handleCancelMultipleDelete}
            size="sm"
          >
            Cancel
          </Button>
          <Modal onOpenChange={handleClose} open={showConfirmationModal}>
            <ModalContent
              data-testid="t--query-run-confirmation-modal"
              style={{ width: "600px" }}
            >
              <ModalHeader>
                {createMessage(DELETING_MULTIPLE_APPLICATION_MODAL_TITLE)}
              </ModalHeader>
              <ModalBody>
                {createMessage(DELETING_MULTIPLE_APPLICATION_MODAL_DESC)}
              </ModalBody>
              <ModalFooter>
                <Button
                  kind="secondary"
                  onClick={() => handleClose(false)}
                  size="md"
                >
                  No
                </Button>
                <Button kind="primary" onClick={handleMultipleDelete} size="md">
                  Yes
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </MultipleDeleteWrapper>
      )}

      {props.add && (
        <>
          <Button size="md">{props.add.title}</Button>
          <Modal
            onOpenChange={(isOpen) => setShowModal(isOpen)}
            open={showModal}
          >
            <ModalContent style={{ width: "640px" }}>
              <ModalHeader>{props.add.title}</ModalHeader>
              <ModalBody>{props.add.form}</ModalBody>
            </ModalContent>
          </Modal>
        </>
      )}
    </SubHeaderWrapper>
  );
}

export default ApplicationsSubHeader;
