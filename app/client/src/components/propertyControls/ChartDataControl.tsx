import React from "react";
import _, { get, isString, set } from "lodash";
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
import { AllChartData, ChartData } from "widgets/ChartWidget";
import { generateReactKey } from "utils/generators";
import { getRandomIntExcludingExistingNumbers } from "utils/helpers";

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

type ControlValidations = {
  [key: string]: {
    isValid: boolean;
    validationMessage: string;
  };
};

type RenderComponentProps = {
  index: string;
  item: ChartData;
  length: number;
  isValid: boolean;
  validationMessage: string;
  deleteOption: (index: string) => void;
  updateOption: (index: string, key: string, value: string) => void;
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
  /**
   * creating objects of validations
   * {
   *  'some-random-string':  {
   *      isValid: false | true,
   *      validationMessage: messageValue,
   *    }
   * }
   * @param message
   * @param isValid
   * @param keys
   * @returns
   */
  getValidations = (message: string, isValid: boolean, keys: string[]) => {
    const validations: ControlValidations = {};
    const messages = message.split("##").filter(Boolean);

    // setting error validation message for existing error validations
    messages.map((key: string) => {
      const messageSplit = key.split("==");
      const messageKey = messageSplit[0];
      const messageValue = messageSplit[1];

      set(validations, `${messageKey}`, {
        isValid: false,
        validationMessage: messageValue,
      });
    });

    // setting validation message for right values
    keys
      .filter((key) => key in validations === false)
      .map((key: string) => {
        set(validations, `${key}`, {
          isValid: true,
          validationMessage: "",
        });
      });

    return validations;
  };

  render() {
    const chartData: AllChartData = _.isString(this.props.propertyValue)
      ? {}
      : this.props.propertyValue;

    const dataLength = Object.keys(chartData).length;
    const { validationMessage, isValid } = this.props;

    const validations: ControlValidations = this.getValidations(
      isString(validationMessage) ? validationMessage : "",
      isValid,
      Object.keys(chartData),
    );

    const evaluatedValue = this.props.evaluatedValue;
    const firstKey = Object.keys(chartData)[0] as string;

    if (this.props.widgetProperties.chartType === "PIE_CHART") {
      const data = dataLength
        ? get(chartData, `${firstKey}`)
        : {
            seriesName: "",
            data: [],
          };

      return (
        <DataControlComponent
          index={firstKey}
          item={data}
          length={1}
          deleteOption={this.deleteOption}
          updateOption={this.updateOption}
          isValid={get(validations, `${firstKey}`).isValid}
          validationMessage={get(validations, `${firstKey}`).validationMessage}
          evaluated={get(evaluatedValue, `${firstKey}`)}
          theme={this.props.theme}
        />
      );
    }
    return (
      <React.Fragment>
        <Wrapper>
          {Object.keys(chartData).map((key: string, index: number) => {
            const data = get(chartData, `${key}`);

            return (
              <DataControlComponent
                key={key}
                index={key}
                item={data}
                length={dataLength}
                deleteOption={this.deleteOption}
                updateOption={this.updateOption}
                isValid={get(validations, `${key}`).isValid}
                validationMessage={get(validations, `${key}`).validationMessage}
                evaluated={get(evaluatedValue, `${key}`)}
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

  deleteOption = (index: string) => {
    this.deleteProperties([`${this.props.propertyName}.${index}`]);
  };

  updateOption = (
    index: string,
    propertyName: string,
    updatedValue: string,
  ) => {
    this.updateProperty(
      `${this.props.propertyName}.${index}.${propertyName}`,
      updatedValue,
    );
  };

  /**
   * it adds new series data object in the chartData
   */
  addOption = () => {
    const randomString = generateReactKey();

    this.updateProperty(`${this.props.propertyName}.${randomString}`, {
      seriesName: "",
      data: JSON.stringify([{ x: "label", y: 50 }]),
    });
  };

  static getControlType() {
    return "CHART_DATA";
  }
}

export default ChartDataControl;
