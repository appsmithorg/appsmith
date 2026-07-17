import React, { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import { TagInput } from "@appsmith/ads-old";
import { Text } from "@appsmith/ads";
import { createMessage, IN_APP_EMBED_SETTING } from "ee/constants/messages";
import {
  normalizeFrameAncestorToken,
  removeAllowAllFrameAncestorChips,
  removeDisableFrameAncestorChips,
} from "./Utils/utils";

// Quote bare "self"/"none" keywords in each comma-separated chip so the chip the
// user sees matches what is stored. Chips can hold whitespace-separated tokens
// (pasted values), so normalize per token.
const normalizeChips = (value: string): string =>
  value
    .split(",")
    .filter(Boolean)
    .map((chip) =>
      chip
        .split(/\s+/)
        .filter(Boolean)
        .map(normalizeFrameAncestorToken)
        .join(" "),
    )
    .join(",");

const ErrorText = styled(Text)`
  display: block;
  margin-top: 4px;
  color: var(--ads-v2-color-fg-error);
`;

interface FrameAncestorsTagInputProps {
  // Injected by the radio field via nodeInputPath. Values are comma-separated.
  input?: {
    value?: string;
    onChange?: (value: string) => void;
  };
  placeholder: string;
  type: string;
}

// Wraps the shared TagInput for the "Limit embedding to certain URLs" list and
// rejects any chip containing a keyword source that contradicts the "limit"
// intent: a bare "*" (belongs to "Allow embedding everywhere") or a
// "none"/"'none'" (belongs to "Disable embedding everywhere" - in CSP "'none'"
// is exclusive and would silently disable embedding if combined with URLs). Both
// checks are whitespace-aware because a pasted value can arrive as a single chip
// (e.g. "'self' *" or "none https://a.com"). Host wildcards like
// "https://*.example.com" are left untouched.
function FrameAncestorsTagInput(props: FrameAncestorsTagInputProps) {
  const { input = {}, ...rest } = props;
  const [error, setError] = useState("");
  const { onChange, value } = input;

  const handleChange = useCallback(
    (nextValue: string) => {
      const withoutWildcard = removeAllowAllFrameAncestorChips(nextValue);
      const withoutDisable = removeDisableFrameAncestorChips(
        withoutWildcard.value,
      );

      if (withoutWildcard.removed) {
        setError(
          createMessage(IN_APP_EMBED_SETTING.limitEmbeddingBareWildcardError),
        );
      } else if (withoutDisable.removed) {
        setError(
          createMessage(IN_APP_EMBED_SETTING.limitEmbeddingDisableKeywordError),
        );
      } else {
        setError("");
      }

      onChange?.(normalizeChips(withoutDisable.value));
    },
    [onChange],
  );

  const tagInputProps = useMemo(
    () => ({ value, onChange: handleChange }),
    [value, handleChange],
  );

  return (
    <>
      <TagInput {...rest} input={tagInputProps} />
      {error && (
        <ErrorText kind="body-s" renderAs="span">
          {error}
        </ErrorText>
      )}
    </>
  );
}

export default FrameAncestorsTagInput;
