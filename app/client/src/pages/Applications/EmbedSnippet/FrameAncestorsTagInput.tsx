import React, { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import { TagInput } from "@appsmith/ads-old";
import { Text } from "@appsmith/ads";
import { createMessage, IN_APP_EMBED_SETTING } from "ee/constants/messages";
import { removeAllowAllFrameAncestorChips } from "./Utils/utils";

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
// rejects any chip containing a bare "*". A bare "*" is not a URL: in a CSP
// frame-ancestors policy it re-opens the instance to every origin, contradicting
// the "limit" intent, so we drop it and steer the admin to the "Allow embedding
// everywhere" radio. The check is whitespace-aware because a pasted value can
// arrive as a single chip (e.g. "'self' *"). Host wildcards like
// "https://*.example.com" are left untouched.
function FrameAncestorsTagInput(props: FrameAncestorsTagInputProps) {
  const { input = {}, ...rest } = props;
  const [error, setError] = useState("");
  const { onChange, value } = input;

  const handleChange = useCallback(
    (nextValue: string) => {
      const { removed, value: cleaned } =
        removeAllowAllFrameAncestorChips(nextValue);

      if (removed) {
        setError(
          createMessage(IN_APP_EMBED_SETTING.limitEmbeddingBareWildcardError),
        );
      } else {
        setError("");
      }

      onChange?.(cleaned);
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
