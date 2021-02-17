import { showEndOnboardingHelper } from "actions/onboardingActions";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import OnboardingHelper from "./Helper";

const EndTourHelper = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(showEndOnboardingHelper());
  }, []);

  return <OnboardingHelper />;
};

export default EndTourHelper;
