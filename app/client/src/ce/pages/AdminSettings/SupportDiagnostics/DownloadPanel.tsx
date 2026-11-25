import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Button, Callout, Input, Text, toast } from "@appsmith/ads";
import SupportDiagnosticsApi from "ee/api/SupportDiagnosticsApi";
import { SUPPORT_DIAGNOSTICS, createMessage } from "ee/constants/messages";
import {
  ReportTooLargeError,
  buildReport,
  reportFileName,
} from "./buildReport";
import type { SectionId, SectionResult } from "./types";
import { isFailure } from "./types";
import { isValidPassword, saveBytes, zipReport } from "./zipReport";

/** Smartlook leaves elements with this class out of session recordings. */
export const SMARTLOOK_MASK_CLASS = "smartlook-hide";

/**
 * Keeps the browser and password managers (1Password, LastPass, Bitwarden)
 * from saving or filling the ZIP password. The ads `InputProps` type leaves
 * out `autoComplete`, but `Input` passes every attribute here to the
 * `<input>`.
 */
const NOT_A_LOGIN_FIELD = {
  autoComplete: "new-password",
  "data-1p-ignore": "",
  "data-lpignore": "true",
  "data-bwignore": "",
};

const UNKNOWN_COLLECTOR_VERSION = "UNKNOWN";
const REASON_ID = "t--support-diagnostics-download-reason";
const PASSWORD_HELP_ID = "t--support-diagnostics-password-help";
const PASSWORD_ERROR_ID = "t--support-diagnostics-password-error";

export type DownloadBlocker =
  | "noneSelected"
  | "waitForCollection"
  | "passwordInvalid";

type Notice =
  | { kind: "saved"; fileName: string; encrypted: boolean }
  | { kind: "tooLarge" }
  | { kind: "zipFailed" };

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ads-v2-spaces-3);
  padding-top: var(--ads-v2-spaces-5);
  border-top: 1px solid var(--ads-v2-color-border);
`;

const PasswordRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--ads-v2-spaces-3);
  width: 100%;
  max-width: 480px;

  > :first-child {
    flex: 1;
  }
`;

const ToggleButton = styled(Button)`
  /* Line up with the input under its label. */
  margin-top: calc(var(--ads-v2-spaces-5) + var(--ads-v2-spaces-1));
`;

interface DownloadPanelProps {
  sections: SectionResult[];
  selected: SectionId[];
  /** True while the list loads or a selected section is still collecting. */
  isCollecting: boolean;
  collectorVersion: string | null;
}

/**
 * Builds the ZIP in the browser. The password lives only in this component's
 * state: it goes to `zipReport` and nowhere else, and it is gone when the
 * component unmounts.
 */
export function DownloadPanel(props: DownloadPanelProps) {
  const { collectorVersion, isCollecting, sections, selected } = props;
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const buildingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(function trackMounted() {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const passwordInvalid = password !== "" && !isValidPassword(password);
  // Checked on blur or on Download, not on each keystroke.
  const showPasswordError = passwordTouched && passwordInvalid;

  let blocker: DownloadBlocker | null = null;

  if (selected.length === 0) blocker = "noneSelected";
  else if (isCollecting) blocker = "waitForCollection";
  else if (showPasswordError) blocker = "passwordInvalid";

  // The password error under the field doubles as the Download reason.
  const reasonId =
    blocker === "passwordInvalid" ? PASSWORD_ERROR_ID : REASON_ID;

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
  }, []);

  const handlePasswordBlur = useCallback(() => {
    setPasswordTouched(true);
  }, []);

  const togglePasswordVisible = useCallback(() => {
    setIsPasswordVisible((visible) => !visible);
  }, []);

  const download = useCallback(async () => {
    if (buildingRef.current || blocker) return;

    if (passwordInvalid) {
      setPasswordTouched(true);

      return;
    }

    buildingRef.current = true;
    setIsBuilding(true);
    setNotice(null);

    const encrypted = password !== "";
    const now = new Date();
    let fileName: string;

    try {
      const { files } = await buildReport({
        sections,
        selected,
        collectorVersion: collectorVersion ?? UNKNOWN_COLLECTOR_VERSION,
        origin: window.location.origin,
        now,
      });
      const bytes = await zipReport(files, encrypted ? password : undefined);

      fileName = reportFileName(now, encrypted);
      saveBytes(bytes, fileName);
    } catch (error) {
      // A fixed message only: the error text never reaches the screen.
      if (mountedRef.current) {
        setNotice({
          kind: error instanceof ReportTooLargeError ? "tooLarge" : "zipFailed",
        });
      }

      return;
    } finally {
      buildingRef.current = false;

      if (mountedRef.current) setIsBuilding(false);
    }

    if (mountedRef.current) setNotice({ kind: "saved", fileName, encrypted });

    let recorded = false;

    try {
      const response = await SupportDiagnosticsApi.recordDownload({
        sectionIds: selected,
        encrypted,
      });

      recorded = !isFailure(response);
    } catch {
      recorded = false;
    }

    if (!recorded) {
      toast.show(createMessage(SUPPORT_DIAGNOSTICS.auditFailed), {
        kind: "warning",
      });
    }
  }, [
    blocker,
    collectorVersion,
    password,
    passwordInvalid,
    sections,
    selected,
  ]);

  const handleDownload = useCallback(() => {
    void download();
  }, [download]);

  return (
    <Panel>
      <PasswordRow>
        <Input
          aria-describedby={
            showPasswordError
              ? `${PASSWORD_ERROR_ID} ${PASSWORD_HELP_ID}`
              : PASSWORD_HELP_ID
          }
          aria-invalid={showPasswordError || undefined}
          {...NOT_A_LOGIN_FIELD}
          className={SMARTLOOK_MASK_CLASS}
          data-recording-sensitive=""
          data-testid="t--support-diagnostics-password"
          isValid={!showPasswordError}
          label={createMessage(SUPPORT_DIAGNOSTICS.password)}
          name="diagnostics-zip-password"
          onBlur={handlePasswordBlur}
          onChange={handlePasswordChange}
          size="md"
          spellCheck={false}
          type={isPasswordVisible ? "text" : "password"}
          value={password}
        />
        <ToggleButton
          aria-label={createMessage(
            isPasswordVisible
              ? SUPPORT_DIAGNOSTICS.hidePassword
              : SUPPORT_DIAGNOSTICS.showPassword,
          )}
          isIconButton
          kind="tertiary"
          onClick={togglePasswordVisible}
          size="md"
          startIcon={isPasswordVisible ? "eye-off" : "eye-on"}
        />
      </PasswordRow>
      {showPasswordError && (
        <Text
          color="var(--ads-v2-colors-control-helper-error-fg)"
          id={PASSWORD_ERROR_ID}
          kind="body-s"
        >
          {createMessage(SUPPORT_DIAGNOSTICS.passwordInvalid)}
        </Text>
      )}
      <Text
        color="var(--ads-v2-color-fg-muted)"
        id={PASSWORD_HELP_ID}
        kind="body-s"
      >
        {createMessage(SUPPORT_DIAGNOSTICS.passwordHelp)}
      </Text>
      <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
        {createMessage(SUPPORT_DIAGNOSTICS.aesNote)}
      </Text>
      {password !== "" && (
        <Callout kind="warning">
          {createMessage(SUPPORT_DIAGNOSTICS.aesWarning)}
        </Callout>
      )}
      <Button
        aria-describedby={blocker ? reasonId : undefined}
        data-testid="t--support-diagnostics-download"
        isDisabled={blocker !== null}
        isLoading={isBuilding}
        kind="primary"
        onClick={handleDownload}
        size="md"
        startIcon="download"
      >
        {createMessage(SUPPORT_DIAGNOSTICS.download, selected.length)}
      </Button>
      {blocker && blocker !== "passwordInvalid" && (
        <Text
          color="var(--ads-v2-color-fg-muted)"
          data-testid="t--support-diagnostics-download-reason"
          id={REASON_ID}
          kind="body-s"
        >
          {createMessage(SUPPORT_DIAGNOSTICS[blocker])}
        </Text>
      )}
      {/* Always rendered, so screen readers announce a new message. */}
      <div role="alert">
        {notice?.kind === "tooLarge" && (
          <Callout kind="error">
            {createMessage(SUPPORT_DIAGNOSTICS.tooLarge)}
          </Callout>
        )}
        {notice?.kind === "zipFailed" && (
          <Callout kind="error">
            {createMessage(SUPPORT_DIAGNOSTICS.zipFailed)}
          </Callout>
        )}
      </div>
      <div aria-live="polite" role="status">
        {notice?.kind === "saved" && (
          <Text kind="body-m">
            {createMessage(
              notice.encrypted
                ? SUPPORT_DIAGNOSTICS.savedEncrypted
                : SUPPORT_DIAGNOSTICS.saved,
              notice.fileName,
            )}
          </Text>
        )}
      </div>
    </Panel>
  );
}
