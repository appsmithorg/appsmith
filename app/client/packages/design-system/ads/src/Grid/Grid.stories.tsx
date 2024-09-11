import React from "react";
import { Grid } from "./Grid";
import { Flex } from "../Flex";
import { Text } from "../Text";
import type { Meta, StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Grid",
  component: Grid,
  argTypes: {
    width: {
      control: {
        type: "text",
      },
      description: "Width of the grid component",
    },
    height: {
      control: {
        type: "text",
      },
      description: "Height of the grid component",
    },
    m: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
        defaultValue: { summary: "spaces-0" },
      },
      description: "Margin on top, left, bottom and right",
    },
    margin: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Margin on top, left, bottom and right",
    },
    mt: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Margin on top",
    },
    marginTop: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Margin on top",
    },
    mr: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Margin on right",
    },
    marginRight: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Margin on right",
    },
    mb: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Margin on bottom",
    },
    marginBottom: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Margin on bottom",
    },
    ml: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Margin on left",
    },
    marginLeft: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Margin on left",
    },
    mx: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Margin on left and right",
    },
    marginX: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Margin on left and right",
    },
    my: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Margin on top and bottom",
    },
    marginY: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Margin on top and bottom",
    },
    p: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Padding on top, left, bottom and right",
    },
    padding: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Padding on top, left, bottom and right",
    },
    pt: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Padding on top",
    },
    paddingTop: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Padding on top",
    },
    pr: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Padding on right",
    },
    paddingRight: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Padding on right",
    },
    pb: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Padding on bottom",
    },
    paddingBottom: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Padding on bottom",
    },
    pl: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Padding on left",
    },
    paddingLeft: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Padding on left",
    },
    px: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Padding on left and right",
    },
    paddingX: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Padding on left and right",
    },
    py: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Padding on top and bottom",
    },
    paddingY: {
      control: {
        type: "select",
      },
      options: [
        "spaces-0",
        "spaces-1",
        "spaces-2",
        "spaces-3",
        "spaces-4",
        "spaces-5",
        "spaces-6",
        "spaces-7",
        "spaces-8",
        "spaces-9",
        "spaces-10",
        "spaces-11",
        "spaces-12",
        "spaces-13",
        "spaces-14",
      ],
      table: {
        type: {
          summary:
            "spaces-0(0) | spaces-1(2px) | spaces-2(4px) | spaces-3(8px) | spaces-4(12px) | spaces-5(16px) | spaces-6(20px) | spaces-7(24px) | spaces-8(28px) | spaces-9(32px) | spaces-10(36px) | spaces-11(40px) | spaces-12(44px) | spaces-13(48px) | spaces-14(52px)",
        },
      },
      description: "Padding on top and bottom",
    },
    display: {
      control: {
        type: "select",
      },
      options: ["grid", "inline-grid"],
      table: {
        type: {
          summary: "grid | inline-grid",
        },
        defaultValue: { summary: "block" },
      },
      description: "Display of the grid component",
    },
    alignItems: {
      control: {
        type: "select",
      },
      options: [
        "normal",
        "stretch",
        "center",
        "start",
        "end",
        "grid-start",
        "grid-end",
        "self-start",
        "self-end",
        "baseline",
      ],
      table: {
        type: {
          summary:
            "normal | stretch | center | start | end | grid-start | grid-end | self-start | self-end | baseline",
        },
        defaultValue: { summary: "normal" },
      },
      description: "Align items of the grid",
    },
    alignContent: {
      control: {
        type: "select",
      },
      options: [
        "normal",
        "stretch",
        "center",
        "start",
        "end",
        "grid-start",
        "grid-end",
        "self-start",
        "self-end",
        "baseline",
      ],
      table: {
        type: {
          summary:
            "normal | stretch | center | start | end | grid-start | grid-end | self-start | self-end | baseline",
        },
        defaultValue: { summary: "normal" },
      },
      description: "Align content of the grid",
    },
    justifyContent: {
      control: {
        type: "select",
      },
      options: [
        "normal",
        "stretch",
        "center",
        "start",
        "end",
        "grid-start",
        "grid-end",
        "self-start",
        "self-end",
        "baseline",
      ],
      table: {
        type: {
          summary:
            "normal | stretch | center | start | end | grid-start | grid-end | self-start | self-end | baseline",
        },
        defaultValue: { summary: "normal" },
      },
      description: "Justify content of the grid",
    },
    justifyItems: {
      control: {
        type: "select",
      },
      options: [
        "normal",
        "stretch",
        "center",
        "start",
        "end",
        "grid-start",
        "grid-end",
        "self-start",
        "self-end",
        "baseline",
      ],
      table: {
        type: {
          summary:
            "normal | stretch | center | start | end | grid-start | grid-end | self-start | self-end | baseline",
        },
        defaultValue: { summary: "normal" },
      },
      description: "Justify items of the grid",
    },
    justifySelf: {
      control: {
        type: "select",
      },
      options: [
        "normal",
        "stretch",
        "center",
        "start",
        "end",
        "grid-start",
        "grid-end",
        "self-start",
        "self-end",
        "baseline",
      ],
      table: {
        type: {
          summary:
            "normal | stretch | center | start | end | grid-start | grid-end | self-start | self-end | baseline",
        },
        defaultValue: { summary: "normal" },
      },
      description: "Justify self of the grid",
    },
    alignSelf: {
      control: {
        type: "select",
      },
      options: [
        "normal",
        "stretch",
        "center",
        "start",
        "end",
        "grid-start",
        "grid-end",
        "self-start",
        "self-end",
        "baseline",
      ],
      table: {
        type: {
          summary:
            "normal | stretch | center | start | end | grid-start | grid-end | self-start | self-end | baseline",
        },
        defaultValue: { summary: "normal" },
      },
      description: "Align self of the grid",
    },
    order: {
      control: {
        type: "text",
      },
      description: "Order of the grid",
    },
    gap: {
      control: {
        type: "text",
      },
      description: "Gap of the grid",
    },
    columnGap: {
      control: {
        type: "text",
      },
      description: "Column gap of the grid",
    },
    rowGap: {
      control: {
        type: "text",
      },
      description: "Row gap of the grid",
    },
    gridColumn: {
      control: {
        type: "text",
      },
      description: "Grid column of the grid",
    },
    gridRow: {
      control: {
        type: "text",
      },
      description: "Grid row of the grid",
    },
    gridAutoFlow: {
      control: {
        type: "select",
      },
      options: ["row", "column", "row dense", "column dense"],
      table: {
        type: {
          summary:
            "row | column | row dense | column dense | inherit | initial | unset | revert | revert-layer",
        },
        defaultValue: { summary: "row" },
      },
      description: "Grid auto flow of the grid",
    },
    gridAutoColumns: {
      control: {
        type: "text",
      },
      description: "Grid auto columns of the grid",
    },
    gridAutoRows: {
      control: {
        type: "text",
      },
      description: "Grid auto rows of the grid",
    },
    gridTemplateColumns: {
      control: {
        type: "text",
      },
      description: "Grid template columns of the grid",
    },
    gridTemplateRows: {
      control: {
        type: "text",
      },
      description: "Grid template rows of the grid",
    },
    gridTemplateAreas: {
      control: {
        type: "text",
      },
      description: "Grid template areas of the grid",
    },
    gridArea: {
      control: {
        type: "text",
      },
      description: "Grid area of the grid",
    },
    minWidth: {
      control: {
        type: "text",
      },
      description: "Minimum width of the grid",
    },
    maxWidth: {
      control: {
        type: "text",
      },
      description: "Maximum width of the grid",
    },
    minHeight: {
      control: {
        type: "text",
      },
      description: "Minimum height of the grid",
    },
    maxHeight: {
      control: {
        type: "text",
      },
      description: "Maximum height of the grid",
    },
    size: {
      control: {
        type: "text",
      },
      description: "Size of the grid. Sets width and height",
    },
    id: {
      control: {
        type: "text",
      },
      description: "Id of the grid",
    },
    className: {
      control: {
        type: "text",
      },
      description: "Classname of the grid",
    },
    verticalAlign: {
      control: {
        type: "select",
      },
      options: [
        "baseline",
        "top",
        "middle",
        "bottom",
        "text-top",
        "text-bottom",
        "initial",
        "inherit",
        "unset",
        "revert",
        "sub",
        "super",
      ],
      description: "Vertical align of the grid",
    },
    overflow: {
      control: {
        type: "text",
      },
      description: "Overflow of the grid",
    },
    overflowX: {
      control: {
        type: "text",
      },
      description: "Overflow of the grid on the x axis",
    },
    overflowY: {
      control: {
        type: "text",
      },
      description: "Overflow of the grid on the y axis",
    },
    bg: {
      control: {
        type: "color",
      },
      description: "Background color of the grid",
    },
    backgroundColor: {
      control: {
        type: "color",
      },
      description: "Background color of the grid",
    },
    opacity: {
      control: {
        type: "text",
      },
      description: "Opacity of the grid",
    },
    border: {
      control: {
        type: "text",
      },
      description: "Border of the grid",
    },
    borderWidth: {
      control: {
        type: "text",
      },
      description: "Border width of the grid",
    },
    borderStyle: {
      control: {
        type: "text",
      },
      description: "Border style of the grid",
    },
    borderColor: {
      control: {
        type: "color",
      },
      description: "Border color of the grid",
    },
    borderRadius: {
      control: {
        type: "text",
      },
      description: "Border radius of the grid",
    },
    borderTop: {
      control: {
        type: "text",
      },
      description: "Border top of the grid",
    },
    borderTopWidth: {
      control: {
        type: "text",
      },
      description: "Border top width of the grid",
    },
    borderTopStyle: {
      control: {
        type: "text",
      },
      description: "Border top style of the grid",
    },
    borderTopColor: {
      control: {
        type: "color",
      },
      description: "Border top color of the grid",
    },
    borderTopLeftRadius: {
      control: {
        type: "text",
      },
      description: "Border top left radius of the grid",
    },
    borderTopRightRadius: {
      control: {
        type: "text",
      },
      description: "Border top right radius of the grid",
    },
    borderRight: {
      control: {
        type: "text",
      },
      description: "Border right of the grid",
    },
    borderRightWidth: {
      control: {
        type: "text",
      },
      description: "Border right width of the grid",
    },
    borderRightStyle: {
      control: {
        type: "text",
      },
      description: "Border right style of the grid",
    },
    borderRightColor: {
      control: {
        type: "color",
      },
      description: "Border right color of the grid",
    },
    borderBottom: {
      control: {
        type: "text",
      },
      description: "Border bottom of the grid",
    },
    borderBottomWidth: {
      control: {
        type: "text",
      },
      description: "Border bottom width of the grid",
    },
    borderBottomStyle: {
      control: {
        type: "text",
      },
      description: "Border bottom style of the grid",
    },
    borderBottomColor: {
      control: {
        type: "color",
      },
      description: "Border bottom color of the grid",
    },
    borderBottomLeftRadius: {
      control: {
        type: "text",
      },
      description: "Border bottom left radius of the grid",
    },
    borderBottomRightRadius: {
      control: {
        type: "text",
      },
      description: "Border bottom right radius of the grid",
    },
    borderLeft: {
      control: {
        type: "text",
      },
      description: "Border left of the grid",
    },
    borderLeftWidth: {
      control: {
        type: "text",
      },
      description: "Border left width of the grid",
    },
    borderLeftStyle: {
      control: {
        type: "text",
      },
      description: "Border left style of the grid",
    },
    borderLeftColor: {
      control: {
        type: "color",
      },
      description: "Border left color of the grid",
    },
    borderX: {
      control: {
        type: "text",
      },
      description: "Border left and right of the grid",
    },
    borderY: {
      control: {
        type: "text",
      },
      description: "Border top and bottom of the grid",
    },
    position: {
      control: {
        type: "text",
      },
      description: "Position of the grid",
    },
    zIndex: {
      control: {
        type: "text",
      },
      description: "Z-index of the grid",
    },
    top: {
      control: {
        type: "text",
      },
      description: "Top of the grid",
    },
    right: {
      control: {
        type: "text",
      },
      description: "Right of the grid",
    },
    bottom: {
      control: {
        type: "text",
      },
      description: "Bottom of the grid",
    },
    left: {
      control: {
        type: "text",
      },
      description: "Left of the grid",
    },
  },
} as Meta<typeof Grid>;

type Story = StoryObj<typeof Grid>;

export const FlexStory: Story = {
  name: "Grid",
  args: {
    bg: "red",
    gap: "spaces-3",
    justifyContent: "center",
    alignItems: "center",
    p: "spaces-4",
    gridTemplateColumns: "100px 60px 50px",
  },
  render: (args) => (
    <Grid {...args}>
      <Flex
        alignItems="center"
        bg="green"
        display="flex"
        h="50px"
        justifyContent="center"
      >
        <Text color="#fff">Box 1</Text>
      </Flex>
      <Flex
        alignItems="center"
        bg="green"
        display="flex"
        h="50px"
        justifyContent="center"
      >
        <Text color="#fff">Box 2</Text>
      </Flex>
      <Flex
        alignItems="center"
        bg="green"
        display="flex"
        h="50px"
        justifyContent="center"
      >
        <Text color="#fff">Box 3</Text>
      </Flex>
      <Flex
        alignItems="center"
        bg="green"
        display="flex"
        h="50px"
        justifyContent="center"
      >
        <Text color="#fff">Box 4</Text>
      </Flex>
      <Flex
        alignItems="center"
        bg="green"
        display="flex"
        h="50px"
        justifyContent="center"
      >
        <Text color="#fff">Box 5</Text>
      </Flex>
      <Flex
        alignItems="center"
        bg="green"
        display="flex"
        h="50px"
        justifyContent="center"
      >
        <Text color="#fff">Box 6</Text>
      </Flex>
    </Grid>
  ),
};
