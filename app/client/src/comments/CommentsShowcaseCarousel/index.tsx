import React, { useState } from "react";

import Text, { TextType } from "components/ads/Text";
import ShowcaseCarousel, { Steps } from "components/ads/ShowcaseCarousel";
import ProfileForm, { PROFILE_FORM, fieldNames } from "./ProfileForm";
import CommentsCarouselModal from "./CommentsCarouselModal";
import ProgressiveImage, {
  Container as ProgressiveImageContainer,
} from "components/ads/ProgressiveImage";

import styled, { withTheme } from "styled-components";
import { Theme } from "constants/DefaultTheme";
import { useDispatch, useSelector } from "react-redux";
import { getFormSyncErrors, getFormValues } from "redux-form";

import { isIntroCarouselVisibleSelector } from "selectors/commentsSelectors";
import { getCurrentUser } from "selectors/usersSelectors";

import { setActiveTour } from "actions/tourActions";
import { TourType } from "entities/Tour";
import { hideCommentsIntroCarousel } from "actions/commentActions";
import {
  updateUserDetails,
  updateUsersCommentOnboardingState,
} from "actions/userActions";

import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

import { getCurrentAppOrg } from "selectors/organizationSelectors";
import useOrg from "utils/hooks/useOrg";
import { getCanCreateApplications } from "utils/helpers";

import stepOneThumbnail from "assets/images/comments-onboarding/thumbnails/step-1.jpg";
import stepTwoThumbnail from "assets/images/comments-onboarding/thumbnails/step-2.jpg";

import { setCommentModeInUrl } from "pages/Editor/ToggleModeButton";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { CommentsOnboardingState } from "constants/userConstants";

const getBanner = (step: number) =>
  `${ASSETS_CDN_URL}/comments/step-${step}.png`;

enum IntroStepsTypesEditor {
  INTRODUCING_LIVE_COMMENTS,
  GIVE_CONTEXTUAL_FEEDBACK,
  PROFILE_FORM,
}

const introStepsEditor = [
  {
    title: "Introducing Live Comments",
    content:
      "You can now collaborate with your users to build apps faster. Invite your team to comment on your apps, exchange thoughts & ship your ideas.",
    banner: getBanner(1),
    bannerThumbnail: stepOneThumbnail,
    hideBackBtn: true,
    showSkipBtn: true,
  },
  {
    title: "Give Contextual Feedback",
    content:
      "Drop a comment on a widget to suggest an improvement. Comments are tagged to the widget and move along with it. Update the widget and iterate your way to shipping your ideas!",
    banner: getBanner(2),
    bannerThumbnail: stepTwoThumbnail,
  },
];

enum IntroStepsTypesViewer {
  INTRODUCING_LIVE_COMMENTS,
  GIVE_CONTEXTUAL_FEEDBACK,
  PROFILE_FORM,
}

const introStepsViewer = [
  {
    title: "Introducing Live Comments",
    content:
      "You can now collaborate with your developers to build apps faster. Exchange thoughts, leave feedback & ship your ideas.",
    banner: getBanner(1),
    bannerThumbnail: stepOneThumbnail,
    hideBackBtn: true,
    showSkipBtn: true,
  },
  {
    title: "Give Contextual Feedback",
    content:
      "Drop a comment on a widget to suggest an improvement or report an issue. Comments are tagged to the widget, resolve them once the updates are live!",
    banner: getBanner(2),
    bannerThumbnail: stepTwoThumbnail,
  },
];

const IntroContentContainer = styled.div`
  padding: ${(props) => props.theme.spaces[5]}px;
`;

const BannerContainer = styled.div`
  & ${ProgressiveImageContainer} {
    width: 100%;
    height: 284px;
  }
  .progressive-image--thumb,
  progressive-image--full {
    object-fit: contain;
  }
`;

function IntroStep(props: {
  title: string;
  content: string;
  banner: string;
  bannerThumbnail: any;
  theme: Theme;
  bannerProps: any;
}) {
  return (
    <>
      <BannerContainer>
        <ProgressiveImage
          imageSource={props.banner}
          thumbnailSource={props.bannerThumbnail}
        />
      </BannerContainer>
      <IntroContentContainer>
        <div style={{ marginBottom: props.theme.spaces[4] }}>
          <Text
            data-cy="comments-carousel-header"
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

const handleStepChange = (currentStep: number, nextStep: number) => {
  AnalyticsUtil.logEvent("COMMENTS_ONBOARDING_STEP_CHANGE", {
    currentStep,
    nextStep,
  });
};

const getSteps = (
  isSubmitProfileFormDisabled: boolean,
  finalSubmit: () => void,
  initialProfileFormValues: { emailAddress?: string; displayName?: string },
  emailDisabled: boolean,
  showEditorSteps: boolean,
  onSkip: () => void,
  isSkipped?: boolean,
) => {
  const introSteps = showEditorSteps ? introStepsEditor : introStepsViewer;

  return [
    ...introSteps.map((stepConfig: any) => ({
      props: {
        ...stepConfig,
        onSkip,
      },
      component: IntroStepThemed,
    })),
    {
      component: ProfileForm,
      props: {
        isSubmitDisabled: isSubmitProfileFormDisabled,
        initialValues: initialProfileFormValues,
        emailDisabled,
        nextBtnText: isSkipped ? "Submit" : "Start Tutorial",
        onSubmit: finalSubmit,
        hideBackBtn: true,
      },
    },
  ];
};

const getInitialAndFinalSteps = (canManage: boolean) => {
  if (canManage) {
    return [
      IntroStepsTypesEditor.INTRODUCING_LIVE_COMMENTS,
      IntroStepsTypesEditor.PROFILE_FORM,
    ];
  } else {
    return [
      IntroStepsTypesViewer.INTRODUCING_LIVE_COMMENTS,
      IntroStepsTypesViewer.PROFILE_FORM,
    ];
  }
};

export default function CommentsShowcaseCarousel() {
  const dispatch = useDispatch();
  const isIntroCarouselVisible = useSelector(isIntroCarouselVisibleSelector);
  const profileFormValues = useSelector(getFormValues(PROFILE_FORM));
  const profileFormErrors = useSelector(
    getFormSyncErrors("PROFILE_FORM"),
  ) as Partial<typeof fieldNames>;

  const [isSkipped, setIsSkipped] = useState(false);

  const currentUser = useSelector(getCurrentUser);
  const { email, name } = currentUser || {};
  const emailDisabled = !!email;

  // don't validate email address if it already exists on the user object
  // this is to unblock the comments feature for github users where email is
  // actually the github username
  const isSubmitDisabled = !!(
    profileFormErrors.displayName ||
    (profileFormErrors.emailAddress && !emailDisabled)
  );

  const initialProfileFormValues = { emailAddress: email, displayName: name };
  const onSubmitProfileForm = () => {
    const { displayName: name, emailAddress: email } =
      (profileFormValues as {
        displayName: string;
        emailAddress: string;
      }) || {};
    dispatch(updateUserDetails({ name, email }));
  };

  const { id } = useSelector(getCurrentAppOrg) || {};
  const currentOrg = useOrg(id);
  const canManage = getCanCreateApplications(currentOrg);

  const [initialStep, finalStep] = getInitialAndFinalSteps(canManage);

  const [activeIndex, setActiveIndex] = useState(initialStep);

  const finalSubmit = async () => {
    AnalyticsUtil.logEvent("COMMENTS_ONBOARDING_SUBMIT_BUTTON_CLICK", {
      skipped: isSkipped,
    });
    dispatch(hideCommentsIntroCarousel());
    dispatch(
      updateUsersCommentOnboardingState(
        isSkipped
          ? CommentsOnboardingState.SKIPPED
          : CommentsOnboardingState.ONBOARDED,
      ),
    );

    if (!isSkipped) {
      const tourType = canManage
        ? TourType.COMMENTS_TOUR_EDIT_MODE
        : TourType.COMMENTS_TOUR_PUBLISHED_MODE;
      dispatch(setActiveTour(tourType));
    } else {
      setCommentModeInUrl(true);
    }

    onSubmitProfileForm();
  };

  const onSkip = () => {
    AnalyticsUtil.logEvent("COMMENTS_ONBOARDING_SKIP_BUTTON_CLICK");
    setActiveIndex(finalStep);
    setIsSkipped(true);
  };

  const steps = getSteps(
    isSubmitDisabled,
    finalSubmit,
    initialProfileFormValues,
    emailDisabled,
    canManage,
    onSkip,
    isSkipped,
  );

  const handleClose = () => {
    dispatch(hideCommentsIntroCarousel());
  };

  if (steps.length === 0 || !isIntroCarouselVisible) return null;

  return (
    <CommentsCarouselModal>
      <ShowcaseCarousel
        activeIndex={activeIndex}
        onClose={handleClose}
        onStepChange={handleStepChange}
        setActiveIndex={setActiveIndex}
        steps={steps as Steps}
      />
    </CommentsCarouselModal>
  );
}
