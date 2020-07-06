import React from "react";
import _ from "lodash";
import BaseControl, { ControlProps } from "./BaseControl";
import { ControlWrapper, StyledPropertyPaneButton } from "./StyledControls";
import styled from "constants/DefaultTheme";
import { FormIcons } from "icons/FormIcons";
import { AnyStyledComponent } from "styled-components";
import CodeEditor from "components/editorComponents/CodeEditor";
import {
  EditorModes,
  EditorSize,
  EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";

const StyledOptionControlWrapper = styled(ControlWrapper)`
  display: flex;
  justify-content: flex-start;
  padding: 0;
  width: 100%;
`;

const StyledDynamicInput = styled.div`
  width: 100%;
  &&& {
    input {
      border: none;
      color: ${props => props.theme.colors.textOnDarkBG};
      background: ${props => props.theme.colors.paneInputBG};
      &:focus {
        border: none;
        color: ${props => props.theme.colors.textOnDarkBG};
        background: ${props => props.theme.colors.paneInputBG};
      }
    }
  }
`;

const StyledDeleteIcon = styled(FormIcons.DELETE_ICON as AnyStyledComponent)`
  padding: 0;
  position: relative;
  margin-left: 15px;
  cursor: pointer;
`;

type RenderComponentProps = {
  index: number;
  item: {
    seriesName: string;
    data: Array<{ x: string; y: string }> | string;
  };
  length: number;
  isValid: boolean;
  validationMessage: string;
  deleteOption: Function;
  updateOption: Function;
  evaluated: {
    seriesName: string;
    data: Array<{ x: string; y: string }> | any;
  };
};

function DataControlComponent(props: RenderComponentProps) {
  const {
    deleteOption,
    updateOption,
    item,
    index,
    length,
    isValid,
    evaluated,
  } = props;
  return (
    <StyledOptionControlWrapper orientation={"VERTICAL"}>
      <StyledOptionControlWrapper orientation={"HORIZONTAL"}>
        <CodeEditor
          expected={"string"}
          input={{
            value: item.seriesName,
            onChange: (
              event: React.ChangeEvent<HTMLTextAreaElement> | string,
            ) => {
              let value = event;
              if (typeof event !== "string") {
                value = event.target.value;
              }
              updateOption(index, "seriesName", value);
            },
          }}
          evaluatedValue={evaluated?.seriesName}
          theme={EditorTheme.DARK}
          size={EditorSize.EXTENDED}
          mode={EditorModes.TEXT_WITH_BINDING}
          tabBehaviour={TabBehaviour.INPUT}
          placeholder="Series Name"
        />
        {length > 1 && (
          <StyledDeleteIcon
            height={20}
            width={20}
            onClick={() => {
              deleteOption(index);
            }}
          />
        )}
      </StyledOptionControlWrapper>
      <StyledDynamicInput
        className={"t--property-control-chart-series-data-control"}
      >
        <CodeEditor
          expected={`Array<x:string, y:number>`}
          input={{
            value: item.data,
            onChange: (
              event: React.ChangeEvent<HTMLTextAreaElement> | string,
            ) => {
              let value = event;
              if (typeof event !== "string") {
                value = event.target.value;
              }
              updateOption(index, "data", value);
            },
          }}
          evaluatedValue={evaluated?.data}
          meta={{
            error: isValid ? "" : "There is an error",
            touched: true,
          }}
          theme={EditorTheme.DARK}
          size={EditorSize.EXTENDED}
          mode={EditorModes.JSON_WITH_BINDING}
          tabBehaviour={TabBehaviour.INPUT}
          placeholder=""
        />
      </StyledDynamicInput>
    </StyledOptionControlWrapper>
  );
}

class ChartDataControl extends BaseControl<ControlProps> {
  getValidations = (message: string, isValid: boolean, len: number) => {
    const validations: Array<{
      isValid: boolean;
      validationMessage: string;
    }> = [];
    let index = -1;
    let validationMessage = "";
    if (message.indexOf("##") !== -1) {
      const messages = message.split("##");
      index = Number(messages[0]);
      validationMessage = messages[1];
    }
    for (let i = 0; i < len; i++) {
      if (i === index) {
        validations.push({
          isValid: false,
          validationMessage: validationMessage,
        });
      } else {
        validations.push({
          isValid: true,
          validationMessage: "",
        });
      }
    }
    return validations;
  };

  render() {
    const chartData: Array<{
      seriesName: string;
      data: Array<{ x: string; y: string }> | string;
    }> =
      this.props.propertyValue && _.isString(this.props.propertyValue)
        ? JSON.parse(this.props.propertyValue)
        : this.props.propertyValue;

    const dataLength = chartData.length;
    const { validationMessage, isValid } = this.props;
    const validations: Array<{
      isValid: boolean;
      validationMessage: string;
    }> = this.getValidations(
      validationMessage || "",
      isValid,
      chartData.length,
    );
    return (
      <React.Fragment>
        {chartData.map((data, index) => {
          return (
            <DataControlComponent
              key={index}
              index={index}
              item={data}
              length={dataLength}
              deleteOption={this.deleteOption}
              updateOption={this.updateOption}
              isValid={validations[index].isValid}
              validationMessage={validations[index].validationMessage}
              evaluated={this.props.evaluatedValue[index]}
            />
          );
        })}
        <StyledPropertyPaneButton
          text="Add Series"
          icon="plus"
          color="#FFFFFF"
          minimal
          onClick={this.addOption}
        />
      </React.Fragment>
    );
  }

  deleteOption = (index: number) => {
    const chartData: object[] =
      this.props.propertyValue && _.isString(this.props.propertyValue)
        ? JSON.parse(this.props.propertyValue)
        : this.props.propertyValue;
    chartData.splice(index, 1);
    this.updateProperty(this.props.propertyName, JSON.stringify(chartData));
  };

  updateOption = (
    index: number,
    propertyName: string,
    updatedValue: string,
  ) => {
    const chartData: Array<{
      seriesName: string;
      data: Array<{ x: string; y: string }> | any;
    }> =
      this.props.propertyValue && _.isString(this.props.propertyValue)
        ? JSON.parse(this.props.propertyValue)
        : this.props.propertyValue;
    const updatedChartData = chartData.map((item, i) => {
      if (index === i) {
        if (propertyName === "seriesName") {
          item.seriesName = updatedValue;
        } else {
          try {
            item.data = JSON.parse(updatedValue);
          } catch (err) {
            item.data = updatedValue;
          }
        }
      }
      return item;
    });
    this.updateProperty(
      this.props.propertyName,
      JSON.stringify(updatedChartData),
    );
  };

  addOption = () => {
    const chartData: Array<{
      seriesName: string;
      data: Array<{ x: string; y: string }> | any;
    }> =
      this.props.propertyValue && _.isString(this.props.propertyValue)
        ? JSON.parse(this.props.propertyValue)
        : this.props.propertyValue;
    chartData.push({ seriesName: "", data: [{ x: "", y: "" }] });
    this.updateProperty(this.props.propertyName, JSON.stringify(chartData));
  };

  static getControlType() {
    return "CHART_DATA";
  }
}

export default ChartDataControl;
