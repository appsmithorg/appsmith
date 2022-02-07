import Icon, { IconSize } from "components/ads/Icon";
import Text, { TextType } from "components/ads/Text";
import { Colors } from "constants/Colors";
import { Theme } from "constants/DefaultTheme";
import { createMessage, READ_DOCUMENTATION } from "constants/messages";
import React from "react";
import { useTheme } from "styled-components";
import InfoWrapper from "./InfoWrapper";
import Link from "./Link";

type Props = {
  message: string;
  docURL?: string;
  isError?: boolean;
  onClickLink?: () => void;
};

export default function Callout(props: Props) {
  const { docURL, isError, message, onClickLink } = props;
  const theme = useTheme() as Theme;
  const color = !isError ? Colors.YELLOW_LIGHT : Colors.CRIMSON;

  return (
    <InfoWrapper isError={isError}>
      <Icon fillColor={color} name="info" size={IconSize.XXXL} />
      <div style={{ display: "block" }}>
        <Text style={{ marginRight: theme.spaces[2] }} type={TextType.P3}>
          {message}
        </Text>
        {docURL && (
          <Link
            color={color}
            onClick={() => {
              window.open(docURL, "_blank");
              if (onClickLink) onClickLink();
            }}
            text={createMessage(READ_DOCUMENTATION)}
          />
        )}
      </div>
    </InfoWrapper>
  );
}
