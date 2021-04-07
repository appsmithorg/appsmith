import { merge } from "lodash";
import React, { useMemo } from "react";
import { withTheme } from "styled-components";
import {
  MentionsInput as ReactMentionsInput,
  Mention as ReactMention,
  MentionsInputProps,
  MentionProps,
} from "react-mentions";
import { Theme } from "constants/DefaultTheme";

const getDefaultMentionsInputStyles = (theme: Theme) => ({
  suggestions: {
    list: {
      backgroundColor: theme.colors.mentionsInput.suggestionsListBackground,
      border: `1px solid ${theme.colors.mentionsInput.suggestionsListBorder}`,
    },
    item: {
      padding: `${theme.spaces[2]}px ${theme.spaces[8]}px`,
      borderBottom: `1px solid ${theme.colors.mentionsInput.itemBorderBottom}`,
      "&focused": {
        backgroundColor: theme.colors.mentionsInput.focusedItemBackground,
      },
    },
  },
});

const MentionsInput = withTheme(
  (props: MentionsInputProps & { theme: Theme }) => {
    const { style, ...rest } = props;
    const styles = useMemo(
      () => merge({}, getDefaultMentionsInputStyles(props.theme), style),
      [props.style, props.theme],
    );

    return (
      <ReactMentionsInput style={styles} {...rest}>
        {props.children}
      </ReactMentionsInput>
    );
  },
);

const getDefaultMentionStyles = (theme: Theme) => {
  return {
    backgroundColor: theme.colors.mentionsInput.mentionBackground,
  };
};

const Mention = withTheme((props: MentionProps & { theme: Theme }) => {
  const { style, ...rest } = props;
  const styles = useMemo(
    () => merge({}, getDefaultMentionStyles(props.theme), style),
    [props.style, props.theme],
  );
  return (
    <ReactMention
      displayTransform={(_id: string, display: string) => `${display}`}
      style={styles}
      {...rest}
    />
  );
});

export default MentionsInput;
export { Mention };
