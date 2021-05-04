import React from "react";

import Text, { TextType } from "components/ads/Text";
import ShowcaseCarousel, { Steps } from "components/ads/ShowcaseCarousel";
import ProfileForm, { PROFILE_FORM } from "./ProfileForm";
import CommentsCarouselModal from "./CommentsCarouselModal";
import CommentsOnboardingStep1 from "assets/images/comments-onboarding/step-1.png";
import CommentsOnboardingStep2 from "assets/images/comments-onboarding/step-2.png";
import CommentsOnboardingStep3 from "assets/images/comments-onboarding/step-3.png";
import CommentsOnboardingStep4 from "assets/images/comments-onboarding/step-4.png";

import styled, { withTheme } from "styled-components";
import { Theme } from "constants/DefaultTheme";
import { useDispatch, useSelector } from "react-redux";
import { getFormSyncErrors, submit } from "redux-form";

const title1 = "Introducing Live Comments";
const title2 = "Give feedback";
const title3 = "Invite other people to your conversations";
const title4 = "You are all set!";

const content1 =
  "We are introducing live comments. From now on you will be able to comment on your apps, tag other people and exchange thoughts in threads. Click ‘Next’ to learn more about comments and start commenting.";
const content2 =
  "Comment on your co-worker’s work and share your thoughts on what works and what needs change.";
const content3 =
  "When leaving a comment you can tag oter people by writing ‘@’ and their name. This way the person you tagged will get a notification and an e-mail that you tagged them in a comment.";
const content4 =
  "By clicking on the comments icon in the top right corner you will activate the ‘collaboration mode’ and will be able to start a thread or answer to someone else’s comment.";

const IntroContentContainer = styled.div`
  padding: ${(props) => props.theme.spaces[5]}px;
`;

function IntroStep(props: {
  title: string;
  content: string;
  banner: typeof CommentsOnboardingStep1;
  theme: Theme;
}) {
  return (
    <>
      <img alt="" src={props.banner} />
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
  onSubmit: any,
  triggerSubmit: any,
  isSubmitDisabled: boolean,
) => [
  {
    component: IntroStepThemed,
    props: {
      title: title1,
      content: content1,
      banner: CommentsOnboardingStep1,
      hideBackBtn: true,
    },
  },
  {
    component: IntroStepThemed,
    props: {
      title: title2,
      content: content2,
      banner: CommentsOnboardingStep2,
    },
  },
  {
    component: IntroStepThemed,
    props: {
      title: title3,
      content: content3,
      banner: CommentsOnboardingStep3,
    },
  },
  {
    component: ProfileForm,
    props: {
      isSubmitDisabled,
      onSubmit,
      triggerSubmit,
    },
  },
  {
    component: IntroStepThemed,
    props: {
      title: title4,
      content: content4,
      banner: CommentsOnboardingStep4,
      hideBackBtn: true,
      nextBtnText: "Start Tutorial",
    },
  },
];

export default function CommentsShowcaseCarousel() {
  const dispatch = useDispatch();
  const triggerSubmit = () => dispatch(submit(PROFILE_FORM));

  const formErrors = useSelector(getFormSyncErrors("PROFILE_FORM"));
  const isSubmitDisabled = Object.keys(formErrors).length !== 0;
  const onSubmit = (result: any) => {
    console.log(result, "handle submit");
  };

  const steps = getSteps(onSubmit, triggerSubmit, isSubmitDisabled);

  return (
    <CommentsCarouselModal>
      <ShowcaseCarousel steps={steps as Steps} />
    </CommentsCarouselModal>
  );
}
