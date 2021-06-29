import React from "react";

import Text, { TextType } from "components/ads/Text";
import ShowcaseCarousel, { Steps } from "components/ads/ShowcaseCarousel";
import ProfileForm, { PROFILE_FORM } from "./ProfileForm";
import CommentsCarouselModal from "./CommentsCarouselModal";
import CommentsOnboardingStep1 from "assets/images/comments-onboarding/step-1.png";
import CommentsOnboardingStep2 from "assets/images/comments-onboarding/step-2.png";
import CommentsOnboardingStep3 from "assets/images/comments-onboarding/step-3.png";
import CommentsOnboardingStep4 from "assets/images/comments-onboarding/step-4.png";
import CommentsOnboardingStep5 from "assets/images/comments-onboarding/step-5.png";

import styled, { withTheme } from "styled-components";
import { Theme } from "constants/DefaultTheme";
import { useDispatch, useSelector } from "react-redux";
import { getFormSyncErrors } from "redux-form";
import { getFormValues } from "redux-form";

import { isIntroCarouselVisibleSelector } from "selectors/commentsSelectors";
import { getCurrentUser } from "selectors/usersSelectors";

import { setActiveTour } from "actions/tourActions";
import { TourType } from "entities/Tour";
import { hideCommentsIntroCarousel } from "actions/commentActions";
import { setCommentsIntroSeen } from "utils/storage";

import { updateUserDetails } from "actions/userActions";

const introSteps = [
  {
    title: "Introducing Live Comments",
    content:
      "We are introducing live comments. From now on you will be able to comment on your apps, tag other people and exchange thoughts in threads. Click ‘Next’ to learn more about comments and start commenting.",
    banner: CommentsOnboardingStep1,
    hideBackBtn: true,
  },
  {
    title: "Give feedback",
    content:
      "Comment on your co-worker’s work and share your thoughts on what works and what needs change.",
    banner: CommentsOnboardingStep2,
  },
  {
    title: "Invite other people to your conversations",
    content:
      "When leaving a comment you can tag other people by writing ‘@’ and their name. This way the person you tagged will get a notification and an e-mail that you tagged them in a comment.",
    banner: CommentsOnboardingStep3,
  },
  {
    title: "Tag a comment to a widget",
    content:
      "If you click on a component while in a comment mode you will tag that comment to that widget. This way if the widget is moved the comment will be moved as well. You can disconnect the comment and widget y simply moving the the comment away from the widget.",
    banner: CommentsOnboardingStep4,
  },
  {
    title: "You are all set!",
    content:
      "By clicking on the comments icon in the top right corner you will activate the ‘collaboration mode’ and will be able to start a thread or answer to someone else’s comment.",
    banner: CommentsOnboardingStep5,
  },
];

const IntroContentContainer = styled.div`
  padding: ${(props) => props.theme.spaces[5]}px;
`;

const StyledImg = styled.img`
  width: 100%;
  object-fit: contain;
`;

function IntroStep(props: {
  title: string;
  content: string;
  banner: typeof CommentsOnboardingStep1;
  theme: Theme;
}) {
  return (
    <>
      <StyledImg alt="" src={props.banner} />
      <IntroContentContainer>
        <div style={{ marginBottom: props.theme.spaces[4] }}>
          <Text
            style={{
              color: props.theme.colors.comments.introTitle,
            }}
            type={TextType.H1}
          >
            {props.title}
          </Text>
        </div>
        <Text
          style={{ color: props.theme.colors.comments.introContent }}
          type={TextType.P1}
        >
          {props.content}
        </Text>
      </IntroContentContainer>
    </>
  );
}

const IntroStepThemed = withTheme(IntroStep);

const getSteps = (
  onSubmitProfileForm: any,
  isSubmitProfileFormDisabled: boolean,
  startTutorial: () => void,
  initialProfileFormValues: { emailAddress?: string; displayName?: string },
  emailDisabled: boolean,
) => [
  ...introSteps.slice(0, 4).map((stepConfig: any) => ({
    props: stepConfig,
    component: IntroStepThemed,
  })),
  {
    component: ProfileForm,
    props: {
      isSubmitDisabled: isSubmitProfileFormDisabled,
      onSubmit: onSubmitProfileForm,
      initialValues: initialProfileFormValues,
      emailDisabled,
    },
  },
  {
    component: IntroStepThemed,
    props: {
      ...introSteps[4],
      hideBackBtn: true,
      nextBtnText: "Start Tutorial",
      onSubmit: startTutorial,
    },
  },
];

export default function CommentsShowcaseCarousel() {
  const dispatch = useDispatch();
  const isIntroCarouselVisible = useSelector(isIntroCarouselVisibleSelector);
  const profileFormValues = useSelector(getFormValues(PROFILE_FORM));
  const profileFormErrors = useSelector(getFormSyncErrors("PROFILE_FORM"));
  const isSubmitDisabled = Object.keys(profileFormErrors).length !== 0;

  const currentUser = useSelector(getCurrentUser);
  const { email, name } = currentUser || {};

  const initialProfileFormValues = { emailAddress: email, displayName: name };
  const onSubmitProfileForm = () => {
    const { displayName: name, emailAddress: email } = profileFormValues as {
      displayName: string;
      emailAddress: string;
    };
    dispatch(updateUserDetails({ name, email }));
  };

  const startTutorial = () => {
    dispatch(setActiveTour(TourType.COMMENTS_TOUR));
    dispatch(hideCommentsIntroCarousel());
    setCommentsIntroSeen(true);
  };

  const steps = getSteps(
    onSubmitProfileForm,
    isSubmitDisabled,
    startTutorial,
    initialProfileFormValues,
    !!email,
  );

  if (!isIntroCarouselVisible) return null;

  return (
    <CommentsCarouselModal>
      <ShowcaseCarousel steps={steps as Steps} />
    </CommentsCarouselModal>
  );
}
