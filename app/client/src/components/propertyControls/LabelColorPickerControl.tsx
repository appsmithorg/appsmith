import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import styled from "styled-components";
import ColorPickerComponent from "components/ads/ColorPickerComponent";
import { flatten, uniq } from "lodash";

const colorList: string[] = [
  "#FF6786",
  "#FFAD5E",
  "#FCD43E",
  "#B0E968",
  "#5CE7EF",
  "#69B5FF",
  "#9177FF",
  "#FF76FE",
  "#61DF48",
  "#6698FF",
  "#F8C356",
  "#6C4CF1",
  "#C5CD90",
  "#6272C8",
  "#4F70FD",
  "#F0F0F0",
];

const LabelColorPickerWrapper = styled.div`
  padding: 5px 0px 5px 9px;
  background-color: #ffffff;
  &:not(:last-child) {
    margin-bottom: 10px;
  }
`;

class LabelColorPickerControl extends BaseControl<
  LabelColorPickerControlProps,
  LabelColorPickerControlState
> {
  constructor(props: LabelColorPickerControlProps) {
    super(props);
    this.state = {
      labelColors: {},
    };
  }

  getLabels = () => {
    const { tableData } = this.props.widgetProperties.evaluatedValues;
    const columnName = this.props.propertyName.split(".")[1];
    const labelsArray = tableData.map((row: any) => {
      return row[columnName].split(",");
    });
    const labelColors: any = {};
    uniq(flatten(labelsArray)).forEach((label: any) => {
      labelColors[label] = this.props.propertyValue
        ? this.props.propertyValue[label]
        : this.props.defaultColor;
    });
    delete labelColors[""];
    this.setState({ labelColors });
  };

  handleChangeColor = (color: string, label: string) => {
    const labelColors = { ...this.state.labelColors };
    labelColors[label] = color;
    this.updateProperty(this.props.propertyName, labelColors);
    this.setState({ labelColors });
  };

  componentDidMount() {
    this.getLabels();
  }

  render() {
    return (
      <div>
        {this.state.labelColors &&
          Object.keys(this.state.labelColors).map((label, index) => (
            <LabelColorPickerWrapper key={index}>
              <ColorPickerComponent
                changeColor={(color) => this.handleChangeColor(color, label)}
                color={this.state.labelColors[label] || this.props.defaultColor}
                colorList={colorList}
                label={label}
              />
            </LabelColorPickerWrapper>
          ))}
      </div>
    );
  }

  static getControlType() {
    return "LABEL_COLOR_PICKER";
  }
}

export interface LabelColorPickerControlProps extends ControlProps {
  defaultColor?: string;
}

export interface LabelColorPickerControlState {
  labelColors?: any;
}

export default LabelColorPickerControl;
