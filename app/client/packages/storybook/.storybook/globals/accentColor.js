import React from "react";
import { Icons, IconButton } from "@storybook/components";

export const accentColor = {
  name: "Accent Color",
  description: "Accent Color",
  defaultValue: null,
  toolbar: {
    icon: "paintbrush",
    items: [
      { title: "Blue", value: "#00aced" },
      { title: "Green", value: "#008744" },
      { title: "Red", value: "#d62d20" },
      { title: "Yellow", value: "#ffa700" },
      { title: "Purple", value: "#5b21b6" },
      { title: "Orange", value: "#f15a24" },
      { title: "Pink", value: "#e01f3d" },
      { title: "Brown", value: "#6d4c41" },
      { title: "Grey", value: "#808080" },
      { title: "Black", value: "#000000" },
      { title: "White", value: "#ffffff" },
    ],
    showName: false,
    dynamicTitle: false,
  },
};
