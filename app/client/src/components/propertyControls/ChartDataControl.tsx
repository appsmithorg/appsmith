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
          evaluatedValue={evaluated?.seriesName}
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
          mode={EditorModes.TEXT_WITH_BINDING}
          placeholder="Series Name"
          size={EditorSize.EXTENDED}
          tabBehaviour={TabBehaviour.INPUT}
          theme={EditorTheme.DARK}
        />
        {length > 1 && (
          <StyledDeleteIcon
            height={20}
            onClick={() => {
              deleteOption(index);
            }}
            width={20}
          />
        )}
      </StyledOptionControlWrapper>
      <StyledDynamicInput
        className={"t--property-control-chart-series-data-control"}
      >
        <CodeEditor
          evaluatedValue={evaluated?.data}
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
          meta={{
            error: isValid ? "" : "There is an error",
            touched: true,
          }}
          mode={EditorModes.JSON_WITH_BINDING}
          placeholder=""
          size={EditorSize.EXTENDED}
          tabBehaviour={TabBehaviour.INPUT}
          theme={EditorTheme.DARK}
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
          deleteOption={this.deleteOption}
          evaluated={evaluatedValue[0]}
          index={0}
          isValid={validations[0].isValid}
          item={data}
          length={1}
          updateOption={this.updateOption}
          validationMessage={validations[0].validationMessage}
        />
      );
    }
    return (
      <>
        {chartData.map((data, index) => {
          return (
            <DataControlComponent
              deleteOption={this.deleteOption}
              evaluated={evaluatedValue[index]}
              index={index}
              isValid={validations[index].isValid}
              item={data}
              key={index}
              length={dataLength}
              updateOption={this.updateOption}
              validationMessage={validations[index].validationMessage}
            />
          );
        })}
        <StyledPropertyPaneButton
          color="#FFFFFF"
          icon="plus"
          minimal
          onClick={this.addOption}
          text="Add Series"
        />
      </>
    );
  }

  deleteOption = (index: number) => {
    this.deleteProperties([`${this.props.propertyName}[${index}]`]);
  };

  updateOption = (
    index: number,
    propertyName: string,
    updatedValue: string,
  ) => {
    this.updateProperty(
      `${this.props.propertyName}[${index}].${propertyName}`,
      updatedValue,
    );
  };

  addOption = () => {
    const chartData: Array<{
      seriesName: string;
      data: string;
    }> = this.props.propertyValue;
    this.updateProperty(`${this.props.propertyName}[${chartData.length}]`, {
      seriesName: "",
      data: JSON.stringify([{ x: "label", y: 50 }]),
    });
  };

  static getControlType() {
    return "CHART_DATA";
  }
}

export default ChartDataControl;
