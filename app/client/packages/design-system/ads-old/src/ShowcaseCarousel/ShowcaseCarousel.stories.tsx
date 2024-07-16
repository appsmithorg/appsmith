import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";

// change ThisComponentName to the name of the component you are writing a story for
import ShowcaseCarouselComponent from "./index";

export default {
  // change ComponentDisplay to the name of the component you are writing a story for
  title: "Design System/ShowcaseCarousel",
  component: ShowcaseCarouselComponent,
} as ComponentMeta<typeof ShowcaseCarouselComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof ShowcaseCarouselComponent> = (args) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  return (
    <ShowcaseCarouselComponent
      {...args}
      activeIndex={activeIndex}
      setActiveIndex={setActiveIndex}
    />
  );
};

export const ShowcaseCarousel = Template.bind({});

function StepComponent1() {
  return <div style={{ padding: "8px" }}>Step 1</div>;
}

function StepComponent2() {
  return <div style={{ padding: "8px" }}>Step 2</div>;
}

ShowcaseCarousel.args = {
  steps: [
    {
      component: StepComponent1,
      props: {},
    },
    {
      component: StepComponent2,
      props: {},
    },
  ],
  onClose: () => {
    // eslint-disable-next-line no-console
    console.log("onClose");
  },
  onStepChange: (current: number, next: number) => {
    // eslint-disable-next-line no-console
    console.log(`onStepChange: ${current} -> ${next}`);
  },
};
