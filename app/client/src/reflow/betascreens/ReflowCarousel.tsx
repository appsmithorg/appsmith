import React, { useState } from "react";
import { Layers } from "constants/Layers";
import ModalComponent from "components/designSystems/appsmith/ModalComponent";
import ShowcaseCarousel, { Steps } from "components/ads/ShowcaseCarousel";
import { noop } from "utils/AppsmithUtils";
import { ReflowBetaScreenSteps } from "./ReflowBetaScreenSteps";
import { useDispatch, useSelector } from "react-redux";
import {
  forceStopOnBoardingAction,
  updateReflowOnBoarding,
} from "actions/reflowActions";
import { AppState } from "reducers";
import { widgetReflowOnBoardingState } from "reducers/uiReducers/reflowReducer";
import { setReflowOnBoardingFlag } from "utils/storage";

function ReflowCarouselModal() {
  const dispatch = useDispatch();
  const onBoardingState = useSelector(
    (state: AppState) => state.ui.widgetReflow.onBoarding,
  );
  const forceStopOnBoarding = useSelector(
    (state: AppState) => state.ui.widgetReflow.forceStopOnBoarding,
  );
  const { done: isReflowOnBoardingDone, finishedStep = -1 } = onBoardingState;
  const numberOfSteps = ReflowBetaScreenSteps.length;
  const stepChange = (current: number) => {
    const onBoardingState: widgetReflowOnBoardingState = {
      done: current === numberOfSteps,
      finishedStep: current,
    };
    dispatch(updateReflowOnBoarding(onBoardingState));
    setReflowOnBoardingFlag(onBoardingState);
  };
  const [showModal, setShowModal] = useState(
    !forceStopOnBoarding && !isReflowOnBoardingDone,
  );
  const onFinish = () => {
    stepChange(numberOfSteps);
    closeDialog();
  };
  const closeDialog = () => {
    dispatch(forceStopOnBoardingAction());
    setShowModal(false);
  };
  const reflowSteps = ReflowBetaScreenSteps.map((step, i) => {
    if (i === numberOfSteps - 1) {
      return {
        ...step,
        props: {
          ...step.props,
          onSubmit: onFinish,
        },
      };
    }
    return step;
  });
  return showModal ? (
    <ModalComponent
      bottom={25}
      canEscapeKeyClose
      canOutsideClickClose
      data-cy={"help-modal"}
      hasBackDrop={false}
      isOpen
      left={25}
      onClose={closeDialog}
      overlayClassName="onboarding-carousel"
      portalClassName="onboarding-carousel-portal"
      scrollContents
      width={325}
      zIndex={Layers.appComments}
    >
      <ShowcaseCarousel
        activeIndex={finishedStep + 1}
        onClose={closeDialog}
        onStepChange={stepChange}
        setActiveIndex={noop}
        steps={reflowSteps as Steps}
      />
    </ModalComponent>
  ) : null;
}

export default ReflowCarouselModal;
