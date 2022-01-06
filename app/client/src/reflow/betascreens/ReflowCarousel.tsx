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
import { getCurrentUser } from "selectors/usersSelectors";
import { User } from "constants/userConstants";
import { inOnboarding } from "sagas/OnboardingSagas";

function ReflowCarouselModal() {
  const onboarding = useSelector(inOnboarding);
  const dispatch = useDispatch();
  const onBoardingState = useSelector(
    (state: AppState) => state.ui.widgetReflow.onBoarding,
  );
  const user: User | undefined = useSelector(getCurrentUser);
  const forceStopOnBoarding = useSelector(
    (state: AppState) => state.ui.widgetReflow.forceStopOnBoarding,
  );
  const { done: isReflowOnBoardingDone, finishedStep = -1 } = onBoardingState;
  const numberOfSteps = ReflowBetaScreenSteps.length;
  const stepChange = (current: number, next: number) => {
    if (current < next) {
      const onBoardingState: widgetReflowOnBoardingState = {
        done: next === numberOfSteps,
        finishedStep: current,
      };
      dispatch(updateReflowOnBoarding(onBoardingState));
      if (user?.email) {
        setReflowOnBoardingFlag(user.email, onBoardingState);
      }
    }
  };
  const [showModal, setShowModal] = useState(
    !forceStopOnBoarding && !isReflowOnBoardingDone && !onboarding,
  );
  const onFinish = () => {
    stepChange(numberOfSteps - 1, numberOfSteps);
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
      canEscapeKeyClose={false}
      canOutsideClickClose={false}
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
