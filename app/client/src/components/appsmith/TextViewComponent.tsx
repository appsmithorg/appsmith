import * as React from "react";
import { Text } from "@blueprintjs/core";
import styled from "styled-components";
import { ComponentProps } from "./BaseComponent";
import { Container } from "./ContainerComponent";

type TextStyleProps = {
  styleName: "primary" | "secondary" | "error";
};

export const BaseText = styled(Text)<TextStyleProps>`
  color: ${props => props.theme.colors[props.styleName]};
`;

export interface TextComponentProps extends ComponentProps {
  text?: string;
  ellipsize?: boolean;
  tagName?: keyof JSX.IntrinsicElements;
}

class TextComponent extends React.Component<TextComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        <Text ellipsize={this.props.ellipsize} tagName={this.props.tagName}>
          {this.props.text}
        </Text>
      </Container>
    );
  }
}

export default TextComponent;
