import React from "react";

import Text, { TextType } from "components/ads/Text";
import ShowcaseCarousel, { Steps } from "components/ads/ShowcaseCarousel";
import ProfileForm, { PROFILE_FORM } from "./ProfileForm";
import CommentsCarouselModal from "./CommentsCarouselModal";

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

import { S3_BUCKET_URL } from "constants/ThirdPartyConstants";

import { getAppMode } from "selectors/entitiesSelector";
import { APP_MODE } from "reducers/entityReducers/appReducer";

const getBanner = (step: number) =>
  `${S3_BUCKET_URL}/comments/step-${step}.png`;

const introStepsEditMode = [
  {
    title: "Introducing Live Comments",
    content:
      "You can now collaborate with your users to build apps faster. Invite your team to comment on your apps, exchange thoughts & ship your ideas.",
    banner: getBanner(1),
    hideBackBtn: true,
  },
  {
    title: "Give Contextual Feedback",
    content:
      "Drop a comment on a widget to suggest an improvement. Comments are tagged to the widget and move along with it. Update the widget and iterate your way to shipping your ideas!",
    banner: getBanner(2),
  },
];

const introStepsViewMode = [
  {
    title: "Introducing Live Comments",
    content:
      "You can now collaborate with your developers to build apps faster. Exchange thoughts, leave feedback & ship your ideas.",
    banner: getBanner(1),
    hideBackBtn: true,
  },
  {
    title: "Give Contextual Feedback",
    content:
      "Drop a comment on a widget to suggest an improvement or report an issue. Comments are tagged to the widget, resolve them once the updates are live!",
    banner: getBanner(2),
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
  banner: string;
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
  appMode?: APP_MODE,
) => {
  const introSteps =
    appMode === APP_MODE.EDIT ? introStepsEditMode : introStepsViewMode;

  return [
    ...introSteps.map((stepConfig: any) => ({
      props: stepConfig,
      component: IntroStepThemed,
    })),
    {
      component: ProfileForm,
      props: {
        isSubmitDisabled: isSubmitProfileFormDisabled,
        initialValues: initialProfileFormValues,
        emailDisabled,
        nextBtnText: "Start Tutorial",
        onSubmit: () => {
          startTutorial();
          onSubmitProfileForm();
        },
        hideBackBtn: true,
      },
    },
  ];
};

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

  const appMode = useSelector(getAppMode);

  const tourType =
    appMode === APP_MODE.EDIT
      ? TourType.COMMENTS_TOUR_EDIT_MODE
      : TourType.COMMENTS_TOUR_PUBLISHED_MODE;

  const startTutorial = () => {
    dispatch(setActiveTour(tourType));
    dispatch(hideCommentsIntroCarousel());
    setCommentsIntroSeen(true);
  };

  const steps = getSteps(
    onSubmitProfileForm,
    isSubmitDisabled,
    startTutorial,
    initialProfileFormValues,
    !!email,
    appMode,
  );

  if (!isIntroCarouselVisible) return null;

  return (
    <CommentsCarouselModal>
      <ShowcaseCarousel steps={steps as Steps} />
    </CommentsCarouselModal>
  );
}
