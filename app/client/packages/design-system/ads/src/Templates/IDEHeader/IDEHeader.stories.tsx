import React from "react";
import type { Meta } from "@storybook/react";
import { IDEHeader } from "./IDEHeader";
import { IDEHeaderTitle } from "./IDEHeaderTitle";
import { IDEHeaderSwitcher } from "./HeaderSwitcher";
import { noop } from "lodash";
import { Icon } from "../../Icon";
import { Button } from "../../Button";
import { List } from "../../List";
import { Flex } from "../../Flex";
import { Text } from "../../Text";
import { ListHeaderContainer } from "../EntityExplorer/styles";

const meta: Meta = {
  title: "ADS/Templates/IDEHeader",
  component: IDEHeader,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story: () => React.ReactNode) => (
      <div style={{ width: "100%" }}>{Story()}</div>
    ),
  ],
};

export default meta;

export const Default = () => (
  <IDEHeader>
    <IDEHeader.Left logo={<Icon name="upload-cloud" size="md" />}>
      <span>Left Content</span>
    </IDEHeader.Left>
    <IDEHeader.Center>
      <span>Center Content</span>
    </IDEHeader.Center>
    <IDEHeader.Right>
      <span>Right Content</span>
    </IDEHeader.Right>
  </IDEHeader>
);

export const WithHeaderTitle = () => {
  return (
    <IDEHeader>
      <IDEHeader.Left logo={<Icon name="upload-cloud" size="md" />}>
        <IDEHeaderTitle title="Settings" />
      </IDEHeader.Left>
      <IDEHeader.Center>
        <div />
      </IDEHeader.Center>
      <IDEHeader.Right>
        <div />
      </IDEHeader.Right>
    </IDEHeader>
  );
};

export const WithHeaderDropdown = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <IDEHeader>
      <IDEHeader.Left logo={<Icon name="upload-cloud" size="md" />}>
        <IDEHeaderSwitcher
          active={open}
          prefix={"Pages"}
          setActive={setOpen}
          title="Page1"
          titleTestId={"testId"}
        >
          <Flex
            flexDirection="column"
            justifyContent="center"
            maxHeight={"300px"}
            overflow="hidden"
          >
            <ListHeaderContainer>
              <Text kind="heading-xs">Pages</Text>
              <Button isIconButton kind="tertiary" startIcon="plus" />
            </ListHeaderContainer>
            <List
              items={[
                {
                  title: "Page1",
                  onClick: noop,
                  description: "",
                  descriptionType: "inline",
                },
                {
                  title: "Page2",
                  onClick: noop,
                  description: "",
                  descriptionType: "inline",
                },
              ]}
            />
          </Flex>
        </IDEHeaderSwitcher>
      </IDEHeader.Left>
      <IDEHeader.Center>
        <div />
      </IDEHeader.Center>
      <IDEHeader.Right>
        <div />
      </IDEHeader.Right>
    </IDEHeader>
  );
};
