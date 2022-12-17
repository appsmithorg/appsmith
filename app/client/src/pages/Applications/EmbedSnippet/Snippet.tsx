import React from "react";
import copy from "copy-to-clipboard";
import { Toaster, Variant, Text, TextType } from "design-system";
import { Colors } from "constants/Colors";
import {
  createMessage,
  IN_APP_EMBED_SETTING,
} from "@appsmith/constants/messages";

type EmbedCodeSnippetProps = {
  snippet: string;
};

function EmbedCodeSnippet(props: EmbedCodeSnippetProps) {
  const onClick = () => {
    copy(props.snippet);
    Toaster.show({
      text: createMessage(IN_APP_EMBED_SETTING.copiedEmbedCode),
      variant: Variant.success,
    });
  };

  return (
    <div
      className="flex select-all flex-1 bg-[color:var(--appsmith-color-black-100)] h-fit"
      data-cy="t--embed-snippet"
      onClick={onClick}
    >
      <Text
        className="p-2 break-all"
        color={Colors.GREY_900}
        type={TextType.P2}
      >
        {props.snippet}
      </Text>
    </div>
  );
}

export default EmbedCodeSnippet;
