import React, { useCallback, useEffect, useState } from "react";
import { Link } from "@appsmith/ads";
import ActionSettings from "../PluginActionToolbar/components/ActionSettings";
import { usePluginActionContext } from "../../PluginActionContext";
import styled from "styled-components";
import {
  createMessage,
  API_EDITOR_TAB_TITLES,
  MORE_ON_QUERY_SETTINGS,
} from "ee/constants/messages";
import { useDispatch, useSelector, type DefaultRootState } from "react-redux";
import {
  isPluginActionSettingsOpen,
  openPluginActionSettings,
} from "../../store";
import { THEME } from "../../types/PluginActionTypes";
import { type DocsLink, openDoc } from "constants/DocumentationLinks";
import { ToolbarSettingsPopover } from "IDE";
import { updateRunBehaviourForActionSettings } from "utils/PluginUtils";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";

export interface SettingsProps {
  formName: string;
  docsLink?: DocsLink;
  dataTestId?: string;
}

const SettingsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-4);
`;

const LearnMoreLink = styled(Link)`
  span {
    font-weight: bold;
  }
`;

const PluginActionSettingsPopover = (props: SettingsProps) => {
  const { settingsConfig } = usePluginActionContext();
  const openSettings = useSelector(isPluginActionSettingsOpen);
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();

  const featureFlagEnabled: boolean = useSelector((state: DefaultRootState) =>
    selectFeatureFlagCheck(state, "release_reactive_actions_enabled"),
  );

  const updateSettingsConfig = updateRunBehaviourForActionSettings(
    settingsConfig || [],
    featureFlagEnabled,
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);

      if (openSettings && !open) {
        dispatch(openPluginActionSettings(false));
      }
    },
    [dispatch, openSettings],
  );

  useEffect(
    function syncOpenState() {
      if (openSettings) {
        handleOpenChange(true);
      }
    },
    [handleOpenChange, openSettings],
  );

  const handleLearnMoreClick = useCallback(() => {
    openDoc(props.docsLink as DocsLink);
  }, [props.docsLink]);

  return (
    <ToolbarSettingsPopover
      dataTestId={props.dataTestId || "t--toolbar-settings-popover-trigger"}
      handleOpenChange={handleOpenChange}
      isOpen={isOpen}
      title={createMessage(API_EDITOR_TAB_TITLES.SETTINGS)}
    >
      <SettingsWrapper>
        <ActionSettings
          actionSettingsConfig={updateSettingsConfig}
          formName={props.formName}
          theme={THEME}
        />
        {props.docsLink && (
          <LearnMoreLink
            className="t--action-settings-documentation-link"
            endIcon="external-link-line"
            kind="secondary"
            onClick={handleLearnMoreClick}
          >
            {createMessage(MORE_ON_QUERY_SETTINGS)}
          </LearnMoreLink>
        )}
      </SettingsWrapper>
    </ToolbarSettingsPopover>
  );
};

export default PluginActionSettingsPopover;
