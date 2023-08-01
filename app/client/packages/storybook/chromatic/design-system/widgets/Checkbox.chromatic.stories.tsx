import React, { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Checkbox } from "@design-system/widgets";

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  title: "Design System/Widgets/Checkbox",
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

type DataAttrWrapperProps = {
  children: React.ReactNode;
  attr: string;
};

const DataAttrWrapper = (props: DataAttrWrapperProps) => {
  const { attr, children } = props;

  const ref = useRef<any>(null);

  useEffect(() => {
    if (attr && ref?.current) {
      if (
        ref.current.setAttribute &&
        typeof ref.current.setAttribute === "function"
      ) {
        ref.current.setAttribute(attr, "");

        return;
      }

      if (typeof ref.current.UNSAFE_getDOMNode === "function") {
        const domNode = ref.current.UNSAFE_getDOMNode();

        if (domNode) domNode.setAttribute(attr, "");

        return;
      }
    }
  }, [attr, ref.current]);

  return React.cloneElement(children as React.ReactElement, { ref });
};

export const States: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        justifyContent: "center",
        gap: "10px",
        gridTemplateColumns: "repeat(5 , 1fr)",
        flexWrap: "wrap",
      }}
    >
      <Checkbox>Default</Checkbox>
      <Checkbox defaultSelected> Checked</Checkbox>
      <Checkbox isIndeterminate>Indeterminate</Checkbox>
      <Checkbox isDisabled>Disabled</Checkbox>
      <Checkbox defaultSelected isDisabled>
        Checked Disabled
      </Checkbox>
      <DataAttrWrapper attr="data-hovered">
        <Checkbox defaultSelected>Hovered</Checkbox>
      </DataAttrWrapper>
    </div>
  ),
};
