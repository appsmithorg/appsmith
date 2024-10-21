import React, { useState } from "react";
import { Tab, TabPanel, Tabs, TabsList } from "@appsmith/ads";
import type { JSActionDropdownOption } from "pages/Editor/JSEditor/JSEditorToolbar";
import type { ModuleInstance } from "ee/constants/ModuleInstanceConstants";
import type { JSAction } from "entities/JSCollection";
import ParametersView from "./ParametersView";
import MissingModule from "../common/MissingModule";
import Body from "../common/Body";

export enum ModuleInstanceEditorTab {
  SETTINGS = "SETTINGS",
  PARAMETERS = "PARAMETERS",
}

interface BodyComponentProps {
  hasMissingModule: boolean;
  moduleInstance: ModuleInstance;
  sortedJSactions: JSAction[];
  parsedDefaultValues: Record<string, string[]>;
  onUpdateParameters: (
    values: Record<string, Array<string | undefined>>,
  ) => void;
  activeJSActionOption: JSActionDropdownOption;
  handleJSActionOptionSelection: (value: string | undefined) => void;
  settingsForm: React.ReactNode;
}

const TabbedBodyComponent = ({
  activeJSActionOption,
  handleJSActionOptionSelection,
  hasMissingModule,
  moduleInstance,
  onUpdateParameters,
  parsedDefaultValues,
  settingsForm,
  sortedJSactions,
}: BodyComponentProps) => {
  const [selectedTab, setSelectedTab] = useState(
    ModuleInstanceEditorTab.PARAMETERS,
  );

  return (
    <Body>
      {hasMissingModule && <MissingModule moduleInstance={moduleInstance} />}
      {!hasMissingModule && (
        <Tabs
          defaultValue={ModuleInstanceEditorTab.PARAMETERS}
          onValueChange={(tab) => {
            setSelectedTab(tab as ModuleInstanceEditorTab);
          }}
          value={selectedTab}
        >
          <TabsList>
            <Tab
              data-testid={
                `t--module-instance-js-editor-` +
                ModuleInstanceEditorTab.PARAMETERS
              }
              value={ModuleInstanceEditorTab.PARAMETERS}
            >
              Parameters
            </Tab>
            <Tab
              data-testid={
                `t--module-instance-js-editor-` +
                ModuleInstanceEditorTab.SETTINGS
              }
              value={ModuleInstanceEditorTab.SETTINGS}
            >
              Settings
            </Tab>
          </TabsList>
          <TabPanel value={ModuleInstanceEditorTab.PARAMETERS}>
            <ParametersView
              actions={sortedJSactions}
              defaultValues={parsedDefaultValues}
              moduleInstanceName={moduleInstance.name}
              onUpdate={onUpdateParameters}
              selectedActionName={activeJSActionOption.label || ""}
              setSelectedAction={handleJSActionOptionSelection}
            />
          </TabPanel>
          <TabPanel value={ModuleInstanceEditorTab.SETTINGS}>
            {settingsForm}
          </TabPanel>
        </Tabs>
      )}
    </Body>
  );
};

export default TabbedBodyComponent;
