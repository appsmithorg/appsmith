import FeatureInfo from "./FeatureInfo";

export const ReflowBetaScreenSteps = [
  {
    component: FeatureInfo,
    props: {
      headingInHTML: "Introducing Reflow and Resize",
      descInHTML:
        "We are introducing Reflow and Resize. From now on you will be able to move widgets out of the way to reach places that often end in widget collision. Click ‘Next’ to learn more about Reflow and Resize.",
    },
  },
  {
    component: FeatureInfo,
    props: {
      headingInHTML: "Moving widgets",
      descInHTML:
        "Try dragging a widget towards other widgets and they will move or resize. You can try it out now!",
    },
  },
  {
    component: FeatureInfo,
    props: {
      headingInHTML: "Resizing widgets",
      descInHTML:
        "Now try resizing a widget towards other widgets and they will move or resize as well. You can try this now as well!",
    },
  },
  {
    component: FeatureInfo,
    props: {
      headingInHTML: "Turn it on or off",
      nextBtnText: "Close",
      descInHTML:
        "This feature is still in BETA, which is why we wanted to let you turn it on/off when you want to. You can always do that in the right-hand sidebar. If something is wrong with this feature, you can always reach out on <a href='https://discord.com/invite/rBTTVJp'>Discord</a>, <a href='https://github.com/appsmithorg/appsmith'>Github</a>, Intercom, or our <a href='https://community.appsmith.com/'>Community Forum</a>.",
    },
  },
];
