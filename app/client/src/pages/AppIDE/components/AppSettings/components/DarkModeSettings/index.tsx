import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";
import { Input, SegmentedControl, Switch, Text } from "@appsmith/ads";
import equal from "fast-deep-equal";
import type { DarkModeSetting } from "constants/AppConstants";
import { defaultDarkModeSetting } from "constants/AppConstants";
import { getDarkModeSetting } from "selectors/darkModeSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { updateApplication } from "ee/actions/applicationActions";
import type { UpdateApplicationPayload } from "ee/api/ApplicationApi";
import { DARK_MODE_SETTINGS, createMessage } from "ee/constants/messages";
import StyledPropertyHelpLabel from "../NavigationSettings/StyledPropertyHelpLabel";

const MODE_OPTIONS = [
  { label: createMessage(DARK_MODE_SETTINGS.modeLight), value: "LIGHT" },
  { label: createMessage(DARK_MODE_SETTINGS.modeDark), value: "DARK" },
  { label: createMessage(DARK_MODE_SETTINGS.modeAuto), value: "AUTO" },
];

function DarkModeSettings() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const savedSetting = useSelector(getDarkModeSetting);
  const [setting, setSetting] = useState<DarkModeSetting>(savedSetting);

  // Latest saved values, read inside the debounced callback so it can be created
  // once without closing over a stale snapshot or resetting its timer.
  const savedSettingRef = useRef(savedSetting);
  const applicationIdRef = useRef(applicationId);

  useEffect(() => {
    setSetting(savedSetting);
    savedSettingRef.current = savedSetting;
  }, [savedSetting]);

  useEffect(() => {
    applicationIdRef.current = applicationId;
  }, [applicationId]);

  const persist = useMemo(
    () =>
      // Refs are read inside the debounced callback (at fire-time, not during
      // render), so this access is safe despite the react-compiler heuristic.
      // eslint-disable-next-line react-compiler/react-compiler
      debounce((next: DarkModeSetting) => {
        if (equal(next, savedSettingRef.current)) return;

        const payload: UpdateApplicationPayload = {
          currentApp: true,
          applicationDetail: { darkModeSetting: next },
        };

        dispatch(updateApplication(applicationIdRef.current, payload));
      }, 200),
    [dispatch],
  );

  useEffect(() => () => persist.cancel(), [persist]);

  const updateSetting = useCallback(
    (partial: Partial<DarkModeSetting>) => {
      const next = { ...defaultDarkModeSetting, ...setting, ...partial };

      setSetting(next);
      persist(next);
    },
    [setting, persist],
  );

  return (
    <div className="px-4 pt-4 space-y-4">
      <Text kind="heading-xs" renderAs="p">
        {createMessage(DARK_MODE_SETTINGS.sectionTitle)}
      </Text>

      <div className="space-y-2">
        <StyledPropertyHelpLabel
          label={createMessage(DARK_MODE_SETTINGS.modeLabel)}
          tooltip={createMessage(DARK_MODE_SETTINGS.modeTooltip)}
        />
        <SegmentedControl
          data-testid="t--dark-mode-default-mode"
          isFullWidth
          onChange={(value: string) =>
            updateSetting({
              defaultMode: value as DarkModeSetting["defaultMode"],
            })
          }
          options={MODE_OPTIONS}
          value={setting.defaultMode}
        />
      </div>

      <Switch
        data-testid="t--dark-mode-allow-switch"
        isSelected={setting.allowEndUserSwitch}
        onChange={(isSelected: boolean) =>
          updateSetting({ allowEndUserSwitch: isSelected })
        }
      >
        <StyledPropertyHelpLabel
          label={createMessage(DARK_MODE_SETTINGS.allowSwitchLabel)}
          tooltip={createMessage(DARK_MODE_SETTINGS.allowSwitchTooltip)}
        />
      </Switch>

      <div className="space-y-2">
        <StyledPropertyHelpLabel
          label={createMessage(DARK_MODE_SETTINGS.customCssLabel)}
          tooltip={createMessage(DARK_MODE_SETTINGS.customCssTooltip)}
        />
        <Input
          data-testid="t--dark-mode-custom-css"
          onChange={(value: string) => updateSetting({ customCss: value })}
          placeholder={createMessage(DARK_MODE_SETTINGS.customCssPlaceholder)}
          renderAs="textarea"
          size="md"
          value={setting.customCss ?? ""}
        />
      </div>
    </div>
  );
}

export default DarkModeSettings;
