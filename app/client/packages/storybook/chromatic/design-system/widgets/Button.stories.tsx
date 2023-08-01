import React, { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import type { ButtonProps } from "@design-system/widgets";
import {
  Button,
  BUTTON_VARIANTS,
  BUTTON_COLORS,
  Icon,
} from "@design-system/widgets";
import { importRemixIcon } from "design-system-old";

const StarIcon = importRemixIcon(() => import("remixicon-react/StarFillIcon"));

const variants = Object.values(BUTTON_VARIANTS);
const semantics = Object.values(BUTTON_COLORS);

const meta: Meta<typeof Button> = {
  component: Button,
  title: "Design System/Widgets/Button",
};

export default meta;

type Story = StoryObj<typeof Button>;

type DataAttrWrapperProps = {
  props: ButtonProps;
  component: typeof Button;
  attr: string;
};

const DataAttrWrapper = (props: DataAttrWrapperProps) => {
  const { attr, component: Component, props: incomingProps } = props;

  const ref = useRef<any>(null);

  useEffect(() => {
    if (attr && ref?.current) ref.current.setAttribute(attr, "");
  }, [attr, ref.current]);

  return <Component ref={ref} {...incomingProps} />;
};

const states = ["", "data-hovered", "data-active", "data-focused"];

export const States: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        justifyContent: "center",
        gap: "10px",
        gridTemplateColumns: "repeat(4, 1fr)",
        flexWrap: "wrap",
      }}
    >
      {variants.map((variant) =>
        semantics.map((color) =>
          states.map((state) => (
            <DataAttrWrapper
              attr={state}
              component={Button}
              key={`${variant}-${color}-${state}`}
              props={{
                variant: variant,
                color: color,
                children: `${variant} ${color} ${state}`,
              }}
            />
          )),
        ),
      )}
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        justifyContent: "center",
        gap: "10px",
        gridTemplateColumns: "repeat(2, 1fr)",
        flexWrap: "wrap",
      }}
    >
      <Button
        icon={
          <Icon>
            <StarIcon />
          </Icon>
        }
      >
        Button with Start Icon
      </Button>
      <Button
        icon={
          <Icon>
            <StarIcon />
          </Icon>
        }
        iconPosition="end"
      >
        Button with End Icon
      </Button>
    </div>
  ),
};
