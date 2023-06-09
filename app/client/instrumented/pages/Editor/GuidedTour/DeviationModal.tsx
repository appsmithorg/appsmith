import { useSelector } from "react-redux";
import {
  enableGuidedTour,
  toggleShowDeviationDialog,
  toggleShowEndTourDialog,
} from "actions/onboardingActions";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
} from "design-system";
import {
  CANCEL_DIALOG,
  createMessage,
  DEVIATION,
  END_CONFIRMATION,
} from "@appsmith/constants/messages";
import React from "react";
import { useDispatch } from "react-redux";
import {
  showDeviatingDialogSelector,
  showEndTourDialogSelector,
} from "selectors/onboardingSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";

function GuidedTourDialog() {
  const showDeviatingDialog = useSelector(showDeviatingDialogSelector);
  const showEndTourDialog = useSelector(showEndTourDialogSelector);
  const dispatch = useDispatch();
  const title = showDeviatingDialog
    ? createMessage(DEVIATION)
    : createMessage(END_CONFIRMATION);

  const onClose = () => {
    if (showDeviatingDialog) {
      dispatch(toggleShowDeviationDialog(false));
    }
    if (showEndTourDialog) {
      dispatch(toggleShowEndTourDialog(false));
    }
  };

  const endTour = () => {
    onClose();
    dispatch(enableGuidedTour(false));
    AnalyticsUtil.logEvent("END_GUIDED_TOUR_CLICK");
  };

  return (
    <Modal
      onOpenChange={onClose}
      open={showEndTourDialog || showDeviatingDialog}
    >
      <ModalContent
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Don't close Modal when pressed outside
        onInteractOutside={(e) => e.preventDefault()}
        style={{ width: "640px" }}
      >
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          You will be able to restart this tutorial at any time by clicking on{" "}
          <b>Welcome tour</b> at the bottom left of the home page
        </ModalBody>
        <ModalFooter>
          <Button
            className="cancel"
            kind="secondary"
            onClick={onClose}
            size="md"
          >
            {createMessage(CANCEL_DIALOG)}
          </Button>
          <Button className="end" onClick={endTour} size="md">
            {createMessage(END_CONFIRMATION)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default GuidedTourDialog;
