import * as Sentry from "@sentry/react";
import React from "react";
import styled from "styled-components";

import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "design-system";
import { ConversionForm } from "./ConversionForm";
import { useDispatch } from "react-redux";
import { getIsAutoLayout } from "selectors/canvasSelectors";
import {
  CONVERT_TO_AUTO_BUTTON,
  CONVERT_TO_AUTO_TITLE,
  CONVERT_TO_FIXED_BUTTON,
  CONVERT_TO_FIXED_TITLE,
  createMessage,
} from "@appsmith/constants/messages";
import BetaCard from "components/editorComponents/BetaCard";
import store from "store";
import {
  setConversionStart,
  setConversionStop,
} from "actions/autoLayoutActions";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import { useConversionForm } from "./hooks/useConversionForm";

const Title = styled.h1`
  color: var(--ads-v2-color-fg-emphasis-plus);
  font-weight: var(--ads-v2-font-weight-bold);
  font-size: var(--ads-v2-font-size-10);
`;

function ConversionButton() {
  const [showModal, setShowModal] = React.useState(false);
  const isAutoLayout = getIsAutoLayout(store.getState());
  const formProps = useConversionForm({ isAutoLayout });
  const dispatch = useDispatch();

  //Text base on if it is an Auto layout
  const titleText = isAutoLayout
    ? CONVERT_TO_FIXED_TITLE
    : CONVERT_TO_AUTO_TITLE;
  const buttonText = isAutoLayout
    ? CONVERT_TO_FIXED_BUTTON
    : CONVERT_TO_AUTO_BUTTON;

  const onOpenOrClose = (isOpen: boolean) => {
    if (isOpen) {
      setShowModal(isOpen);
      dispatch(setConversionStart(CONVERSION_STATES.START));
    } else {
      setShowModal(isOpen);
      dispatch(setConversionStop());
    }
  };

  return (
    <>
      <Button
        className="w-full !mb-5"
        id="t--layout-conversion-cta"
        kind="secondary"
        onClick={() => onOpenOrClose(true)}
        size="md"
      >
        {createMessage(buttonText)}
      </Button>
      <Modal open={showModal}>
        <ModalContent>
          <ModalHeader onClose={() => onOpenOrClose(false)}>
            <div className="flex items-center gap-3">
              <Title>{createMessage(titleText)}</Title>
              <BetaCard />
            </div>
          </ModalHeader>
          <ModalBody>
            <ConversionForm {...formProps} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

ConversionButton.displayName = "ConversionButton";

export default React.memo(Sentry.withProfiler(ConversionButton));
