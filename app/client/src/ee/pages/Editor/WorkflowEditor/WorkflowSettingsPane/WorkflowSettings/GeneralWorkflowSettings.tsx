import classNames from "classnames";
import type { AppIconName } from "design-system-old";
import { Input, Text } from "design-system";
import { IconSelector } from "design-system-old";
import { debounce } from "lodash";
import React, { useCallback, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import TextLoaderIcon from "pages/Editor/AppSettingsPane/Components/TextLoaderIcon";
import {
  getCurrentWorkflow,
  getCurrentWorkflowId,
  getIsSavingWorkflowName,
} from "@appsmith/selectors/workflowSelectors";
import { updateWorkflowName } from "@appsmith/actions/workflowActions";
import {
  GENERAL_SETTINGS_SECTION_CONTENT_HEADER,
  GENERAL_SETTINGS_WORKFLOW_ICON_LABEL,
  GENERAL_SETTINGS_WORKFLOW_NAME_EMPTY_MESSAGE,
  GENERAL_SETTINGS_WORKFLOW_NAME_LABEL,
  createMessage,
} from "@appsmith/constants/messages";
import { SectionTitle } from "./TriggerWorkflowSettings";

const IconSelectorWrapper = styled.div`
  position: relative;
  .icon-selector {
    max-height: 100px;
    padding: 0;
    .t--icon-selected,
    .t--icon-not-selected {
      margin: 0;
    }
    gap: 2px;
  }

  .t--icon-selected {
    background-color: var(--ads-v2-color-bg-muted);
    svg path {
      fill: var(--ads-v2-color-fg);
    }
  }

  .t--icon-not-selected {
    background-color: transparent;
    svg path {
      fill: var(--ads-v2-color-fg);
    }
  }
`;

function GeneralWorkflowSettings() {
  const dispatch = useDispatch();
  const workflowId = useSelector(getCurrentWorkflowId);
  const workflow = useSelector(getCurrentWorkflow);
  const isSavingWorkflowName = useSelector(getIsSavingWorkflowName);

  const [workflowName, setWorkflowName] = useState(workflow?.name);
  const [isWorkflowNameValid, setIsWorkflowNameValid] = useState(true);
  const [workflowIcon, setWorkflowIcon] = useState(
    workflow?.icon as AppIconName,
  );

  useEffect(() => {
    !isSavingWorkflowName && setWorkflowName(workflow?.name);
  }, [workflow, workflow?.name, isSavingWorkflowName]);

  const updateWorkflowSettings = useCallback(
    debounce(() => {
      const isWorkflowNameUpdated = workflowName !== workflow?.name;

      const payload = { name: workflow?.name || "", workflowId };
      if (isWorkflowNameUpdated && isWorkflowNameValid) {
        payload.name = workflowName || "";
      }
      // TODO (workflows): ICON UPDATE TO BE IMPLEMENTED
      // icon ? (payload.icon = icon) : null;

      isWorkflowNameUpdated &&
        dispatch(updateWorkflowName(payload.name, workflowId || ""));
    }, 50),
    [workflowName, workflow, workflowId],
  );

  const onChange = (value: string) => {
    if (!value || value.trim().length === 0) {
      setIsWorkflowNameValid(false);
    } else {
      if (!isSavingWorkflowName) {
        setIsWorkflowNameValid(true);
      }
    }

    setWorkflowName(value);
  };

  return (
    <div className="flex flex-col mx-[24px] w-[650px]">
      <SectionTitle kind="heading-m">
        {createMessage(GENERAL_SETTINGS_SECTION_CONTENT_HEADER)}
      </SectionTitle>
      <div className="flex-col justify-between content-center">
        <div
          className={classNames({
            "pt-1 pb-2 relative": true,
            "pb-4": !isWorkflowNameValid,
          })}
        >
          {isSavingWorkflowName && <TextLoaderIcon />}
          <Input
            defaultValue={workflowName}
            errorMessage={
              isWorkflowNameValid
                ? undefined
                : GENERAL_SETTINGS_WORKFLOW_NAME_EMPTY_MESSAGE()
            }
            // undefined sent implicitly - parameter "icon"
            id="t--general-settings-workflow-name"
            isValid={isWorkflowNameValid}
            label={GENERAL_SETTINGS_WORKFLOW_NAME_LABEL()}
            onBlur={() => updateWorkflowSettings()}
            onChange={onChange}
            onKeyPress={(ev: React.KeyboardEvent) => {
              if (ev.key === "Enter") {
                // undefined sent implicitly - parameter "icon"
                updateWorkflowSettings();
              }
            }}
            placeholder="Workflow name"
            size="md"
            type="text"
            value={workflowName}
          />
        </div>

        <Text kind="action-m">{GENERAL_SETTINGS_WORKFLOW_ICON_LABEL()}</Text>
        <IconSelectorWrapper
          className="pt-1"
          id="t--general-settings-workflow-icon"
        >
          <IconSelector
            className="icon-selector"
            fill
            onSelect={(icon: AppIconName) => {
              setWorkflowIcon(icon);
              // updateWorkflowSettings - passing `icon` because `WorkflowIcon`
              // will be not updated untill the component is re-rendered
              // updateWorkflowSettings(icon); TO BE IMPLEMENTED
              updateWorkflowSettings();
            }}
            selectedColor="black"
            selectedIcon={workflowIcon}
          />
        </IconSelectorWrapper>
      </div>
    </div>
  );
}

export default GeneralWorkflowSettings;
