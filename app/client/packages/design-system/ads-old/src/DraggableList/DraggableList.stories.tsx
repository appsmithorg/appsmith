import React from "react";
import type { ComponentMeta, ComponentStory } from "@storybook/react";
import styled from "styled-components";

import { DraggableList as DraggableListComponent } from "./index";

const StoryDecorator = styled.div`
  width: 80vw;
  height: 80vh;
  padding: 1rem;

  & > div {
    height: 100% !important;
    padding: 8px;
  }
`;

const ItemRenderer = styled.div`
  width: 50%;
  height: 100%;
  padding: 10px;
  cursor: grab;
  box-shadow: 0px 0px 2px 0px var(--ads-v2-color-border);
  background-color: var(--ads-v2-color-bg);
  color: var(--ads-v2-color-fg);
`;

export default {
  title: "Design System/DraggableList",
  component: DraggableListComponent,
  decorators: [
    (Story) => (
      <StoryDecorator>
        <Story />
      </StoryDecorator>
    ),
  ],
} as ComponentMeta<typeof DraggableListComponent>;

// eslint-disable-next-line react/function-component-definition
const Template: ComponentStory<typeof DraggableListComponent> = (args) => {
  return <DraggableListComponent {...args} />;
};

export const DraggableList = Template.bind({}) as StoryObj;

const draggableListRenderItem = ({ item }) => {
  return <ItemRenderer>{item.name}</ItemRenderer>;
};

DraggableList.args = {
  items: [
    {
      id: 1,
      name: "Item 1",
      isDragDisabled: true,
    },
    {
      id: 2,
      name: "Item 2",
    },
    {
      id: 3,
      name: "Item 3",
    },
  ],
  keyAccessor: "id",
  onUpdate: (items) => {
    // eslint-disable-next-line no-console
    console.log(items);
  },
  ItemRenderer: draggableListRenderItem,
  itemHeight: 70,
  shouldReRender: false,
};
