import React from "react";
import { Flex, Input } from "@appsmith/ads";
import { RELEASE_NOTES_INPUT } from "git/ee/constants/messages";
import { noop } from "lodash";

interface ReleaseNotesInputProps {
  onTextChange: (text: string | null) => void;
  text: string | null;
}

function ReleaseNotesInput({
  onTextChange = noop,
  text = null,
}: ReleaseNotesInputProps) {
  return (
    <Flex flexDirection={"column"}>
      <Input
        autoFocus
        label={RELEASE_NOTES_INPUT.TITLE}
        onChange={onTextChange}
        placeholder={RELEASE_NOTES_INPUT.PLACEHOLDER}
        renderAs="textarea"
        size="md"
        type="text"
        value={text ?? undefined}
      />
    </Flex>
  );
}

export default ReleaseNotesInput;
