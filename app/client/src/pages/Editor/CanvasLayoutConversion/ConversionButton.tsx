import * as Sentry from "@sentry/react";
import React, { useRef } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@appsmith/ads";
import { ConversionForm } from "./ConversionForm";
import { useDispatch, useSelector } from "react-redux";
import { getIsAutoLayout } from "selectors/canvasSelectors";
import {
  CONVERT_TO_AUTO_BUTTON,
  CONVERT_TO_AUTO_TITLE,
  CONVERT_TO_FIXED_BUTTON,
  CONVERT_TO_FIXED_TITLE,
  createMessage,
} from "ee/constants/messages";
import BetaCard from "components/editorComponents/BetaCard";
import store from "store";
import {
  setConversionStart,
  setConversionStop,
} from "actions/autoLayoutActions";
import { CONVERSION_STATES } from "reducers/uiReducers/layoutConversionReducer";
import { useConversionForm } from "./hooks/useConversionForm";
import type { AppState } from "ee/reducers";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

function ConversionButton() {
  const [showModal, setShowModal] = React.useState(false);
  const isAutoLayout = useRef(getIsAutoLayout(store.getState()));
  const formProps = useConversionForm({ isAutoLayout: isAutoLayout.current });
  const dispatch = useDispatch();
  const isConversionFlowEnabled = useFeatureFlag(
    FEATURE_FLAG.release_layout_conversion_enabled,
  );
  const conversionState = useSelector(
    (state: AppState) => state.ui.layoutConversion.conversionState,
  );

  //Text base on if it is an auto-layout
  const titleText = isAutoLayout.current
    ? CONVERT_TO_FIXED_TITLE
    : CONVERT_TO_AUTO_TITLE;
  const buttonText = isAutoLayout.current
    ? CONVERT_TO_FIXED_BUTTON
    : CONVERT_TO_AUTO_BUTTON;

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => {
      dispatch(setConversionStop());
    }, 0);
  };

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      closeModal();
    }
  };

  const openModal = () => {
    setShowModal(true);
    dispatch(setConversionStart(CONVERSION_STATES.START));
  };

  const hideCloseButton =
    conversionState === CONVERSION_STATES.COMPLETED_SUCCESS ||
    conversionState === CONVERSION_STATES.CONVERSION_SPINNER ||
    conversionState === CONVERSION_STATES.SNAPSHOT_SPINNER;

  return isConversionFlowEnabled ? (
    <>
      <Button
        className="w-full !mb-5"
        id="t--layout-conversion-cta"
        kind="secondary"
        onClick={openModal}
        size="md"
      >
        {createMessage(buttonText)}
      </Button>
      <Modal onOpenChange={onOpenChange} open={showModal}>
        <ModalContent
          // Don't close Modal on escape key press
          onEscapeKeyDown={(e) => e.preventDefault()}
          // Don't close Modal when pressed outside
          onInteractOutside={(e) => e.preventDefault()}
          style={{ width: "640px" }}
        >
          <ModalHeader isCloseButtonVisible={!hideCloseButton}>
            <div className="flex items-center gap-3">
              {createMessage(titleText)}
              <BetaCard />
            </div>
          </ModalHeader>
          <ModalBody>
            <ConversionForm closeModal={closeModal} {...formProps} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  ) : null;
}

ConversionButton.displayName = "ConversionButton";

export default Sentry.withProfiler(ConversionButton);
