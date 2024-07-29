import React from "react";
import { Tabs, TabsList, Tab, TabPanel } from "./Tab";
import type {
  TabPanelProps,
  TabProps,
  TabsListProps,
  TabsProps,
} from "./Tab.types";
import { Text } from "../Text";
import { Input } from "../Input";
import { Button } from "../Button";
import type { StoryObj } from "@storybook/react";

export default {
  title: "ADS/Components/Tab",
  component: Tabs,
  argTypes: {
    asChild: {
      table: {
        disable: true,
      },
    },
  },
};

// eslint-disable-next-line react/function-component-definition
const TabsTemplate = (args: TabsProps) => {
  return (
    <Tabs defaultValue="tab1" {...args}>
      <TabsList>
        <Tab notificationCount={3} value="tab1">
          Account
        </Tab>
        <Tab notificationCount={15} value="tab2">
          Password
        </Tab>
        <Tab value="tab3">Account</Tab>
        <Tab value="tab4">Test</Tab>
        <Tab value="tab5">General</Tab>
      </TabsList>
      <TabPanel className="TabsContent" value="tab1">
        <div
          style={{
            marginTop: "24px",
            width: "40%",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <Input label="First name" renderAs="input" size="md" />
          <Input label="Last name" renderAs="input" size="md" />
          <Button UNSAFE_width="150px" kind="primary" size="md">
            Submit
          </Button>
        </div>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab2">
        <div
          style={{
            marginTop: "24px",
            width: "40%",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <Input label="Old password" renderAs="input" size="md" />
          <Input label="New Password" renderAs="input" size="md" />
          <Button UNSAFE_width="150px" kind="primary" size="md">
            Change
          </Button>
        </div>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab3">
        <Text>Tab3 Content</Text>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab4">
        <Text>Tab4 Content</Text>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab5">
        <Text>Tab5 Content</Text>
      </TabPanel>
    </Tabs>
  );
};

export const TabsExample = TabsTemplate.bind({}) as StoryObj;
TabsExample.storyName = "Tabs";
TabsExample.args = {
  defaultValue: "tab1",
};
TabsExample.argTypes = {
  defaultValue: {
    description: "The value of the tab to select by default, if uncontrolled",
    control: {
      type: "radio",
      options: ["tab1", "tab2"],
    },
  },
  value: {
    description: "The value for the selected tab, if controlled",
    control: {
      type: "radio",
      options: ["tab1", "tab2"],
    },
  },
  orientation: {
    description:
      "The orientation the tabs are layed out. Mainly so arrow navigation is done accordingly (left & right vs. up & down). Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous.",
    control: {
      type: "radio",
      options: ["horizontal", "vertical"],
    },
  },
  onValueChange: {
    description: "A function called when a new tab is selected",
  },
};

// eslint-disable-next-line react/function-component-definition
const TabTemplate = (args: TabProps) => {
  return (
    <Tabs>
      <TabsList>
        <Tab {...args} />
      </TabsList>
    </Tabs>
  );
};

export const TabExample = TabTemplate.bind({}) as StoryObj;
TabExample.storyName = "Tab";
TabExample.args = {
  children: "Account",
  value: "tab1",
};
TabExample.argTypes = {
  children: {
    description: "The label given to the tab",
    required: true,
  },
  value: {
    description:
      "A unique id given to the tab that must match with the corresponding Tab Panel.",
    required: true,
  },
  notificationCount: {
    description: "the number of notifications the tab contains",
    control: {
      type: "number",
    },
  },
};

// eslint-disable-next-line react/function-component-definition
const TabsListTemplate = (args: TabsListProps) => {
  return (
    <Tabs>
      <TabsList {...args}>
        <Tab value="t1">Account</Tab>
        <Tab value="t2">Password</Tab>
      </TabsList>
    </Tabs>
  );
};

export const TabsListExample = TabsListTemplate.bind({}) as StoryObj;
TabsListExample.storyName = "TabsList";
TabsListExample.parameters = {
  controls: { hideNoControlsWarning: true },
};

// eslint-disable-next-line react/function-component-definition
const TabPanelTemplate = (args: TabPanelProps) => {
  return (
    <Tabs defaultValue="tabber1">
      <TabsList>
        <Tab value="tabber1">Account</Tab>
        <Tab value="tabber2">Password</Tab>
      </TabsList>
      <TabPanel {...args} value="tabber1" />
      <TabPanel {...args} value="tabber2" />
    </Tabs>
  );
};

export const TabPanelExample = TabPanelTemplate.bind({}) as StoryObj;
TabPanelExample.storyName = "TabPanel";
TabPanelExample.args = {
  children: (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Text kind="heading-m">Welcome to the Appsmith Emporium!</Text>
      <Text kind="body-m">
        Peruse the wide variety of templates available that may cater to your
        interests, or build your own!
      </Text>
    </div>
  ),
};
TabPanelExample.argTypes = {
  children: {
    description:
      "The content that goes into the panel. Accepts any react node.",
    required: true,
  },
  value: {
    description:
      "A unique id given to the tab panel that must match with the corresponding tab.",
    required: true,
  },
};

export function TabWithManyTabs() {
  return (
    <Tabs defaultValue="tab1">
      <TabsList>
        <Tab notificationCount={3} value="tab1">
          Account
        </Tab>
        <Tab notificationCount={15} value="tab2">
          Password
        </Tab>
        <Tab value="tab3">Account</Tab>
        <Tab value="tab4">Test</Tab>
        <Tab value="tab5">Another Account</Tab>
        <Tab value="tab6">Testing this</Tab>
        <Tab value="tab7">Tabs main</Tab>
        <Tab value="tab8">General</Tab>
        <Tab value="tab9">Test 3</Tab>
        <Tab value="tab10">Test 4</Tab>
        <Tab value="tab11">Test 5</Tab>
        <Tab value="tab12">Test 6</Tab>
        <Tab value="tab13">Test 7</Tab>
        <Tab value="tab14">Test 8</Tab>
        <Tab value="tab15">Test 9</Tab>
      </TabsList>
      <TabPanel className="TabsContent" value="tab1">
        <div
          style={{
            marginTop: "24px",
            width: "40%",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <Input label="First name" renderAs="input" size="md" />
          <Input label="Last name" renderAs="input" size="md" />
          <Button UNSAFE_width="150px" kind="primary" size="md">
            Submit
          </Button>
        </div>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab2">
        <div
          style={{
            marginTop: "24px",
            width: "40%",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <Input label="Old password" renderAs="input" size="md" />
          <Input label="New Password" renderAs="input" size="md" />
          <Button UNSAFE_width="150px" kind="primary" size="md">
            Change
          </Button>
        </div>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab3">
        <Text>Tab3 Content</Text>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab4">
        <Text>Tab4 Content</Text>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab5">
        <Text>Tab5 Content</Text>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab6">
        <Text>Tab6 Content</Text>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab7">
        <Text>Tab7 Content</Text>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab8">
        <Text>Tab8 Content</Text>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab9">
        <Text>Tab9 Content</Text>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab10">
        <Text>Tab10 Content</Text>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab11">
        <Text>Tab11 Content</Text>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab12">
        <Text>Tab12 Content</Text>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab13">
        <Text>Tab13 Content</Text>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab14">
        <Text>Tab14 Content</Text>
      </TabPanel>
      <TabPanel className="TabsContent" value="tab15">
        <Text>Tab15 Content</Text>
      </TabPanel>
    </Tabs>
  );
}
