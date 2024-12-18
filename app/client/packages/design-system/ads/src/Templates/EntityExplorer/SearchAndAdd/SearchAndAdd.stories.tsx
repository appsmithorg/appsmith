/* eslint-disable no-console */
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { SearchAndAdd, type SearchAndAddProps } from ".";

const meta: Meta<typeof SearchAndAdd> = {
  title: "ADS/Templates/Entity Explorer/Search And Add",
  component: SearchAndAdd,
};

export default meta;

const Template = (props: SearchAndAddProps) => {
  const { onAdd, onSearch, placeholder, showAddButton = true } = props;

  return (
    <div style={{ width: 250 }}>
      <SearchAndAdd
        {...{
          onAdd,
          onSearch,
          showAddButton,
          placeholder,
        }}
      />
    </div>
  );
};

export const Basic = Template.bind({}) as StoryObj;

Basic.args = {
  onAdd: () => console.log("Add clicked"),
  onSearch: (searchTerm: string) => console.log(searchTerm),
  placeholder: "Search",
  showAddButton: true,
};
