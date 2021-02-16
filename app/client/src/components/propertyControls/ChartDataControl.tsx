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
import * as Sentry from "@sentry/react";

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
      color: ${(props) => props.theme.colors.textOnDarkBG};
      background: ${(props) => props.theme.colors.paneInputBG};
      &:focus {
        border: none;
        color: ${(props) => props.theme.colors.textOnDarkBG};
        background: ${(props) => props.theme.colors.paneInputBG};
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
  deleteOption: (index: number) => void;
  updateOption: (index: number, key: string, value: string) => void;
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
              let value: string = event as string;
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
              let value: string = event as string;
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

  getEvaluatedValue = () => {
    if (Array.isArray(this.props.evaluatedValue)) {
      return this.props.evaluatedValue;
    }
    return [];
  };

  componentDidMount() {
    this.migrateChartData(this.props.propertyValue);
  }

  migrateChartData(chartData: Array<{ seriesName: string; data: string }>) {
    // Added a migration script for older chart data that was strings
    // deprecate after enough charts have moved to the new format
    if (_.isString(chartData)) {
      try {
        const parsedData: Array<{
          seriesName: string;
          data: string;
        }> = JSON.parse(chartData);
        this.updateProperty(this.props.propertyName, parsedData);
        return parsedData;
      } catch (error) {
        Sentry.captureException({
          message: "Chart Migration Failed",
          oldData: this.props.propertyValue,
        });
      }
    } else {
      return this.props.propertyValue;
    }
  }

  render() {
    const chartData: Array<{ seriesName: string; data: string }> = _.isString(
      this.props.propertyValue,
    )
      ? []
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

    const evaluatedValue = this.getEvaluatedValue();
    if (this.props.widgetProperties.chartType === "PIE_CHART") {
      const data = chartData.length
        ? chartData[0]
        : {
            seriesName: "",
            data: "",
          };
      return (
        <DataControlComponent
          index={0}
          item={data}
          length={1}
          deleteOption={this.deleteOption}
          updateOption={this.updateOption}
          isValid={validations[0].isValid}
          validationMessage={validations[0].validationMessage}
          evaluated={evaluatedValue[0]}
        />
      );
    }
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
              evaluated={evaluatedValue[index]}
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
    const chartData: Array<{
      seriesName: string;
      data: string;
    }> = this.props.propertyValue;
    chartData.splice(index, 1);
    this.updateProperty(this.props.propertyName, chartData);
  };

  updateOption = (
    index: number,
    propertyName: string,
    updatedValue: string,
  ) => {
    const chartData: Array<{
      seriesName: string;
      data: string;
    }> = this.props.propertyValue;
    const updatedChartData = chartData.map((item, i) => {
      if (index === i) {
        return {
          ...item,
          [propertyName]: updatedValue,
        };
      }
      return item;
    });
    this.updateProperty(this.props.propertyName, updatedChartData);
  };

  addOption = () => {
    const chartData: Array<{
      seriesName: string;
      data: string;
    }> = this.props.propertyValue;
    const updatedChartData = [
      ...chartData,
      {
        seriesName: "",
        data: JSON.stringify([{ x: "label", y: 50 }]),
      },
    ];
    this.updateProperty(this.props.propertyName, updatedChartData);
  };

  static getControlType() {
    return "CHART_DATA";
  }
}

export default ChartDataControl;
