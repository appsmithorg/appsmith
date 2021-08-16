import React from "react";
import styled from "styled-components";
import { Tag, Icon } from "@blueprintjs/core";
import { BlueprintControlTransform } from "constants/DefaultTheme";

const fontColor: { [key: string]: string } = {
  "#FF6786": "#FFFFFF",
  "#FFAD5E": "#000000",
  "#FCD43E": "#000000",
  "#B0E968": "#000000",
  "#5CE7EF": "#000000",
  "#69B5FF": "#FFFFFF",
  "#9177FF": "#FFFFFF",
  "#FF76FE": "#FFFFFF",
  "#61DF48": "#000000",
  "#6698FF": "#FFFFFF",
  "#F8C356": "#000000",
  "#6C4CF1": "#FFFFFF",
  "#C5CD90": "#000000",
  "#6272C8": "#FFFFFF",
  "#4F70FD": "#FFFFFF",
  "#F0F0F0": "#000000",
};

const TagContainer = styled.span<{ color?: string; size?: string }>`
  && {
    &:not(:last-child) {
      margin-right: 5px;
    }
    .bp3-tag {
      color: ${(props) => (props.color ? fontColor[props.color] : "#000000")};
      background-color: ${(props) => (props.color ? props.color : "#EBEBEB")};
      padding: ${(props) => (props.size === "LARGE" ? "2px 7px" : "0px 6px")};
      min-height: 16px;
    }
  }
  ${BlueprintControlTransform}
`;
export class TagComponent extends React.Component<TagComponentProps> {
  render() {
    return (
      <TagContainer color={this.props.color} size={this.props.tagSize}>
        <Tag large={this.props.tagSize === "LARGE"} round>
          {this.props.type === "HELP" && (
            <Icon color="#343434" icon="help" iconSize={11} />
          )}{" "}
          {this.props.label}
        </Tag>
      </TagContainer>
    );
  }
}

export interface TagComponentProps {
  tagSize?: string;
  color?: string;
  label?: string;
  type?: "COMMON" | "HELP";
}
