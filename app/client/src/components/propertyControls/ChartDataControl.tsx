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
import { Size, Category } from "components/ads/Button";

const Wrapper = styled.div`
  background-color: ${(props) =>
    props.theme.colors.propertyPane.dropdownSelectBg};
  padding: 0 8px;
`;

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

  &&& svg {
    path {
      fill: ${(props) => props.theme.colors.propertyPane.jsIconBg};
    }
  }
`;

const ActionHolder = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const StyledLabel = styled.label`
  margin: 8px auto 8px 0;

  && {
    color: ${(props) => props.theme.colors.propertyPane.label};
  }
`;

const Box = styled.div`
  height: 16px;
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
  theme: EditorTheme;
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
      <ActionHolder>
        <StyledLabel>Series Title</StyledLabel>
        {length > 1 && (
          <StyledDeleteIcon
            height={20}
            width={20}
            onClick={() => {
              deleteOption(index);
            }}
          />
        )}
      </ActionHolder>
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
          theme={props.theme}
          size={EditorSize.EXTENDED}
          mode={EditorModes.TEXT_WITH_BINDING}
          tabBehaviour={TabBehaviour.INPUT}
          placeholder="Series Name"
        />
      </StyledOptionControlWrapper>
      <StyledLabel>Series Data</StyledLabel>
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
          theme={props.theme}
          size={EditorSize.EXTENDED}
          mode={EditorModes.JSON_WITH_BINDING}
          tabBehaviour={TabBehaviour.INPUT}
          placeholder=""
        />
      </StyledDynamicInput>
      <Box></Box>
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
          index={0}
          item={data}
          length={1}
          deleteOption={this.deleteOption}
          updateOption={this.updateOption}
          isValid={validations[0].isValid}
          validationMessage={validations[0].validationMessage}
          evaluated={evaluatedValue[0]}
          theme={this.props.theme}
        />
      );
    }
    return (
      <React.Fragment>
        <Wrapper>
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
                theme={this.props.theme}
              />
            );
          })}
        </Wrapper>

        <StyledPropertyPaneButton
          icon="plus"
          tag="button"
          type="button"
          text="Add Series"
          onClick={this.addOption}
          size={Size.medium}
          category={Category.tertiary}
        />
      </React.Fragment>
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
