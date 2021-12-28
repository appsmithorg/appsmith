import {
  enableGuidedTour,
  toggleShowDeviationDialog,
  toggleShowEndTourDialog,
} from "actions/onboardingActions";
import Button, { Category, Size } from "components/ads/Button";
import DialogComponent from "components/ads/DialogComponent";
import {
  CANCEL_DIALOG,
  createMessage,
  DEVIATION,
  END_CONFIRMATION,
} from "constants/messages";
import React from "react";
import { useDispatch } from "react-redux";
import {
  showDeviatingDialogSelector,
  showEndTourDialogSelector,
} from "selectors/onboardingSelectors";
import { useSelector } from "store";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";

const ButtonsWrapper = styled.div`
  display: flex;
  gap: 20px;
  justify-content: flex-end;
  margin-top: 30px;

  .cancel {
    color: #716e6e;
    border-color: #716e6e;

    :hover {
      background-color: #f1f1f1;
    }
  }

  .end {
    background-color: #f22b2b;
    border-color: #f22b2b;

    :hover {
      background-color: #f34040;
    }
  }
`;

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
    <DialogComponent
      canEscapeKeyClose
      isOpen={showEndTourDialog || showDeviatingDialog}
      onClose={onClose}
      title={title}
    >
      <span>
        You will be able to restart this tutorial at any time by clicking on{" "}
        <b>Welcome Tour</b> at the bottom left of the home page
      </span>
      <ButtonsWrapper>
        <Button
          category={Category.secondary}
          className="cancel"
          onClick={onClose}
          size={Size.large}
          tag="button"
          text={createMessage(CANCEL_DIALOG)}
        />
        <Button
          className="end"
          onClick={endTour}
          size={Size.large}
          tag="button"
          text={createMessage(END_CONFIRMATION)}
        />
      </ButtonsWrapper>
    </DialogComponent>
  );
}

export default GuidedTourDialog;
