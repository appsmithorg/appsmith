import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";
import styled from "styled-components";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  SegmentedControl,
  Switch,
  Text,
} from "@appsmith/ads";
import equal from "fast-deep-equal";
import type { DarkModeSetting } from "constants/AppConstants";
import { defaultDarkModeSetting } from "constants/AppConstants";
import { DARK_MODE_PRESET_CSS } from "constants/darkModeColors";
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

// The ADS switch label sets `word-break: break-all`, which splits the label
// mid-word in the narrow settings pane. Wrap at word boundaries instead.
const SwitchRow = styled.div`
  label {
    word-break: normal;
    overflow-wrap: anywhere;
  }
`;

// Monospace, scrollable textarea for the inline CSS editor.
const CssEditor = styled.div`
  textarea {
    min-height: 96px;
    max-height: 200px;
    overflow: auto;
    resize: vertical;
    white-space: pre;
    font-family: var(--ads-v2-font-family-code, monospace);
  }
`;

// Tall, scrollable monospace editor inside the pop-out modal.
const ModalCssEditor = styled.div`
  textarea {
    height: 60vh;
    overflow: auto;
    resize: none;
    white-space: pre;
    font-family: var(--ads-v2-font-family-code, monospace);
  }
`;

const CssLabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

// Seed the custom-CSS editor with the dark preset when the developer hasn't
// saved their own, so they start from the actual applied styles rather than a
// blank box and can tweak the values.
const withCssTemplate = (s: DarkModeSetting): DarkModeSetting => ({
  ...s,
  customCss: s.customCss || DARK_MODE_PRESET_CSS,
});

function DarkModeSettings() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const savedSetting = useSelector(getDarkModeSetting);
  const [setting, setSetting] = useState<DarkModeSetting>(() =>
    withCssTemplate(savedSetting),
  );
  const [isCssModalOpen, setIsCssModalOpen] = useState(false);
  // Draft edited inside the pop-out modal; only applied on Save, discarded on Cancel.
  const [cssDraft, setCssDraft] = useState("");

  // Latest saved values, read inside the debounced callback so it can be created
  // once without closing over a stale snapshot or resetting its timer.
  const savedSettingRef = useRef(savedSetting);
  const applicationIdRef = useRef(applicationId);

  useEffect(() => {
    setSetting(withCssTemplate(savedSetting));
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

  const openCssModal = useCallback(() => {
    setCssDraft(setting.customCss ?? "");
    setIsCssModalOpen(true);
  }, [setting.customCss]);

  const saveCssModal = useCallback(() => {
    updateSetting({ customCss: cssDraft });
    setIsCssModalOpen(false);
  }, [cssDraft, updateSetting]);

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

      <SwitchRow>
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
      </SwitchRow>

      <SwitchRow>
        <Switch
          data-testid="t--dark-mode-override-css"
          isSelected={setting.overrideCss ?? false}
          onChange={(isSelected: boolean) =>
            updateSetting({ overrideCss: isSelected })
          }
        >
          <StyledPropertyHelpLabel
            label={createMessage(DARK_MODE_SETTINGS.overrideCssLabel)}
            tooltip={createMessage(DARK_MODE_SETTINGS.overrideCssTooltip)}
          />
        </Switch>
      </SwitchRow>

      <div className="space-y-2">
        <CssLabelRow>
          <StyledPropertyHelpLabel
            label={createMessage(DARK_MODE_SETTINGS.customCssLabel)}
            tooltip={createMessage(DARK_MODE_SETTINGS.customCssTooltip)}
          />
          <Button
            aria-label={createMessage(DARK_MODE_SETTINGS.expandCss)}
            data-testid="t--dark-mode-css-expand"
            isIconButton
            kind="tertiary"
            onClick={openCssModal}
            size="sm"
            startIcon="fullscreen-line"
          />
        </CssLabelRow>
        <CssEditor>
          <Input
            data-testid="t--dark-mode-custom-css"
            isDisabled={!setting.overrideCss}
            onChange={(value: string) => updateSetting({ customCss: value })}
            placeholder={createMessage(DARK_MODE_SETTINGS.customCssPlaceholder)}
            renderAs="textarea"
            size="md"
            value={setting.customCss ?? ""}
          />
        </CssEditor>
      </div>

      <Modal onOpenChange={setIsCssModalOpen} open={isCssModalOpen}>
        <ModalContent style={{ width: "900px", maxWidth: "90vw" }}>
          <ModalHeader>
            {createMessage(DARK_MODE_SETTINGS.customCssLabel)}
          </ModalHeader>
          <ModalBody>
            <ModalCssEditor>
              <Input
                data-testid="t--dark-mode-custom-css-modal"
                onChange={(value: string) => setCssDraft(value)}
                placeholder={createMessage(
                  DARK_MODE_SETTINGS.customCssPlaceholder,
                )}
                renderAs="textarea"
                size="md"
                value={cssDraft}
              />
            </ModalCssEditor>
          </ModalBody>
          <ModalFooter>
            <Button
              kind="secondary"
              onClick={() => setIsCssModalOpen(false)}
              size="md"
            >
              {createMessage(DARK_MODE_SETTINGS.cancel)}
            </Button>
            <Button kind="primary" onClick={saveCssModal} size="md">
              {createMessage(DARK_MODE_SETTINGS.save)}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default DarkModeSettings;
