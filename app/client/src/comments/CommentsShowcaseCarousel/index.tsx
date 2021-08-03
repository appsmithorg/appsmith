import React from "react";

import Text, { TextType } from "components/ads/Text";
import ShowcaseCarousel, { Steps } from "components/ads/ShowcaseCarousel";
import ProfileForm, { PROFILE_FORM } from "./ProfileForm";
import CommentsCarouselModal from "./CommentsCarouselModal";
import ProgressiveImage, {
  Container as ProgressiveImageContainer,
} from "components/ads/ProgressiveImage";

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

import { getCurrentAppOrg } from "selectors/organizationSelectors";
import useOrg from "utils/hooks/useOrg";
import { getCanManage } from "utils/helpers";

import stepOneThumbnail from "assets/images/comments-onboarding/thumbnails/step-1.jpg";
import stepTwoThumbnail from "assets/images/comments-onboarding/thumbnails/step-2.jpg";

const getBanner = (step: number) =>
  `${S3_BUCKET_URL}/comments/step-${step}.png`;

const introStepsEditor = [
  {
    title: "Introducing Live Comments",
    content:
      "You can now collaborate with your users to build apps faster. Invite your team to comment on your apps, exchange thoughts & ship your ideas.",
    banner: getBanner(1),
    bannerThumbnail: stepOneThumbnail,
    hideBackBtn: true,
  },
  {
    title: "Give Contextual Feedback",
    content:
      "Drop a comment on a widget to suggest an improvement. Comments are tagged to the widget and move along with it. Update the widget and iterate your way to shipping your ideas!",
    banner: getBanner(2),
    bannerThumbnail: stepTwoThumbnail,
  },
];

const introStepsViewer = [
  {
    title: "Introducing Live Comments",
    content:
      "You can now collaborate with your developers to build apps faster. Exchange thoughts, leave feedback & ship your ideas.",
    banner: getBanner(1),
    bannerThumbnail: stepOneThumbnail,
    hideBackBtn: true,
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
  showEditorSteps: boolean,
) => {
  const introSteps = showEditorSteps ? introStepsEditor : introStepsViewer;

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
    const { displayName: name, emailAddress: email } =
      (profileFormValues as {
        displayName: string;
        emailAddress: string;
      }) || {};
    dispatch(updateUserDetails({ name, email }));
  };

  const { id } = useSelector(getCurrentAppOrg) || {};
  const currentOrg = useOrg(id);
  const canManage = getCanManage(currentOrg);

  const startTutorial = () => {
    const tourType = canManage
      ? TourType.COMMENTS_TOUR_EDIT_MODE
      : TourType.COMMENTS_TOUR_PUBLISHED_MODE;

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
    canManage,
  );

  if (steps.length === 0 || !isIntroCarouselVisible) return null;

  return (
    <CommentsCarouselModal>
      <ShowcaseCarousel steps={steps as Steps} />
    </CommentsCarouselModal>
  );
}
