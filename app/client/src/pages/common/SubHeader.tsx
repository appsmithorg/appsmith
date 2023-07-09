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
} from "design-system";
import { useSelector } from "react-redux";
import { getIsFetchingApplications } from "@appsmith/selectors/applicationSelectors";
import { Indices } from "constants/Layers";
import { useIsMobileDevice } from "utils/hooks/useDeviceDetect";

const SubHeaderWrapper = styled.div<{
  isMobile?: boolean;
  isBannerVisible?: boolean;
}>`
  width: ${({ isMobile }) => (isMobile ? `100%` : `250px`)};
  display: flex;
  justify-content: space-between;
  ${(props) => (props.isBannerVisible ? "margin-top: 96px" : "")};
  background: var(--ads-v2-color-bg);
  z-index: ${({ isMobile }) => (isMobile ? Indices.Layer8 : Indices.Layer9)};
  ${({ isMobile }) => isMobile && `padding: 12px 16px; margin: 0px;`}
`;
const SearchContainer = styled.div`
  flex-grow: 1;
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
  const isFetchingApplications = useSelector(getIsFetchingApplications);
  const isMobile = useIsMobileDevice();
  const query =
    props.search &&
    props.search.queryFn &&
    _.debounce(props.search.queryFn, 250, { maxWait: 1000 });

  return (
    <SubHeaderWrapper
      isBannerVisible={props.isBannerVisible}
      isMobile={isMobile}
    >
      <SearchContainer>
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
