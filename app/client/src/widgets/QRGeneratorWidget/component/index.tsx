import * as React from "react";
import type { Text } from "@blueprintjs/core";
import type { ComponentProps } from "widgets/BaseComponent";
import type { TextSize } from "constants/WidgetConstants";
import { isEqual, get } from "lodash";
import type { Color } from "constants/Colors";
import { OverflowTypes } from "../constants";

export type TextAlign = "LEFT" | "CENTER" | "RIGHT" | "JUSTIFY";

const ELLIPSIS_HEIGHT = 15;

export interface TextComponentProps extends ComponentProps {
  text?: string;
  textAlign: TextAlign;
  ellipsize?: boolean;
  fontSize?: TextSize;
  fontFamily: string;
  isLoading: boolean;
  backgroundColor?: string;
  textColor?: string;
  fontStyle?: string;
  disableLink: boolean;
  truncateButtonColor?: string;
  borderColor?: Color;
  borderWidth?: number;
  overflow: OverflowTypes;
}

interface State {
  isTruncated: boolean;
  showModal: boolean;
}

type TextRef = React.Ref<Text> | undefined;

class TextComponent extends React.Component<TextComponentProps, State> {
  state = {
    isTruncated: false,
    showModal: false,
  };

  textRef = React.createRef() as TextRef;

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTruncate = (element: any) => {
    const { isTruncated } = this.state;

    // add ELLIPSIS_HEIGHT and check content content is overflowing or not
    return (
      element.scrollHeight >
      element.offsetHeight + (isTruncated ? ELLIPSIS_HEIGHT : 0)
    );
  };

  componentDidMount = () => {
    const textRef = get(this.textRef, "current.textRef");

    if (textRef && this.props.overflow === OverflowTypes.TRUNCATE) {
      const isTruncated = this.getTruncate(textRef);

      this.setState({ isTruncated });
    }
  };

  // TODO: Whenever prepping for production, need to solve this -
  // https://github.com/appsmithorg/appsmith/pull/15990#discussion_r962672349
  componentDidUpdate = (prevProps: TextComponentProps) => {
    if (!isEqual(prevProps, this.props)) {
      if (this.props.overflow === OverflowTypes.TRUNCATE) {
        const textRef = get(this.textRef, "current.textRef");

        if (textRef) {
          const isTruncated = this.getTruncate(textRef);

          this.setState({ isTruncated });
        }
      } else if (
        prevProps.overflow === OverflowTypes.TRUNCATE &&
        this.props.overflow !== OverflowTypes.TRUNCATE.valueOf()
      ) {
        this.setState({ isTruncated: false });
      }
    }
  };

  handleModelOpen = () => {
    this.setState({ showModal: true });
  };

  handleModelClose = () => {
    this.setState({ showModal: false });
  };

  render() {
    const { text } = this.props;

    return (
      <div>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${text}`}
        />
      </div>
    );
  }
}

export default TextComponent;
