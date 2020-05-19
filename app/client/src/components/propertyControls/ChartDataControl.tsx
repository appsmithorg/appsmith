import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  ControlWrapper,
  StyledInputGroup,
  StyledPropertyPaneButton,
} from "./StyledControls";
import styled from "constants/DefaultTheme";
import { FormIcons } from "icons/FormIcons";
import { AnyStyledComponent } from "styled-components";
import DynamicAutocompleteInput from "components/editorComponents/DynamicAutocompleteInput";

const StyledOptionControlWrapper = styled(ControlWrapper)`
  display: flex;
  justify-content: flex-start;
  padding: 0;
  width: 100%;
`;

const StyledOptionControlInputGroup = styled(StyledInputGroup)`
  margin-right: 2px;
  width: 100%;
  margin-bottom: 0;
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
    data: Array<{ x: string; y: string }> | any;
  };
  length: number;
  deleteOption: Function;
  updateOption: Function;
};

function DataControlComponent(props: RenderComponentProps) {
  const { deleteOption, updateOption, item, index, length } = props;
  return (
    <StyledOptionControlWrapper orientation={"VERTICAL"}>
      <StyledOptionControlWrapper orientation={"HORIZONTAL"}>
        <StyledOptionControlInputGroup
          type="text"
          placeholder="Series Name"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            updateOption(index, "seriesName", event.target.value);
          }}
          defaultValue={item.seriesName}
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
      <StyledDynamicInput>
        <DynamicAutocompleteInput
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
          meta={{
            error: "",
            touched: true,
          }}
          theme={"DARK"}
          singleLine={false}
          placeholder=""
          forwardRef={React.createRef<HTMLTextAreaElement>()}
        />
      </StyledDynamicInput>
    </StyledOptionControlWrapper>
  );
}

class ChartDataControl extends BaseControl<ControlProps> {
  render() {
    const chartData: Array<{
      seriesName: string;
      data: Array<{ x: string; y: string }> | any;
    }> = this.props.propertyValue || [];
    const dataLength = chartData.length;
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
    const chartData: object[] = this.props.propertyValue.slice();
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
      data: Array<{ x: string; y: string }> | any;
    }> = this.props.propertyValue;
    this.updateProperty(
      this.props.propertyName,
      chartData.map((item, i) => {
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
      }),
    );
  };

  addOption = () => {
    const chartData: Array<{
      seriesName: string;
      data: Array<{ x: string; y: string }> | any;
    }> = this.props.propertyValue ? this.props.propertyValue.slice() : [];
    chartData.push({ seriesName: "", data: [{ x: "", y: "" }] });
    this.updateProperty(this.props.propertyName, chartData);
  };

  static getControlType() {
    return "CHART_DATA";
  }
}

export default ChartDataControl;
