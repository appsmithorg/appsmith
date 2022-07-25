import React from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";

import styled from "constants/DefaultTheme";
import {
  Classes,
  ISliderProps,
  NumericInput,
  Slider,
  INumericInputProps,
  InputGroup,
  RangeSlider,
  NumberRange,
} from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";
import { ThemeProp } from "components/ads/common";
import EventEmitter from "utils/EventEmitter";
import { FeedbackState } from "pages/Editor/PropertyPane/DHFeedbacks";

const StyledSlider = styled(Slider)`
  &&&&& input:checked ~ span {
    background: ${Colors.GREY_10};
  }

  & input:focus + .bp3-control-indicator {
    box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.2) !important;
  }
`;

const StyledNumericInput = styled(NumericInput)<ThemeProp & INumericInputProps>`
  &&& {
    margin-left: 6px;
    &.bp3-control-group {
      .${Classes.INPUT} {
        &:focus {
          box-shadow: none;
          border-radius: 0;
          border: 1px solid var(--appsmith-input-focus-border-color);
        }
      }
      .bp3-input-group {
        border-radius: 0;
        width: 50px;
        align-self: stretch;
        input {
          height: 100%;
        }
        .bp3-input {
          font-size: 14px;
        }
      }
      .bp3-button-group {
        .bp3-button {
          border-radius: 0;
          &:focus {
            border: 1px solid var(--appsmith-input-focus-border-color);
          }
        }
      }
    }
  }
`;

function AdsSlider(props: ISliderProps) {
  const max = (props.value || 0) + 100;
  return (
    <StyledSlider
      {...props}
      className={
        props.className
          ? props.className + " " + replayHighlightClass
          : replayHighlightClass
      }
      labelStepSize={Math.floor(max / 4)}
      max={max}
      min={4}
    />
  );
}

const AbhisheksSuggestionContainer = styled.div``;
class SliderControl extends BaseControl<SliderControlProps> {
  state = {
    feedback: FeedbackState,
    showSlider: false,
  };

  renderMain() {
    return (
      <AdsSlider
        className={this.props.propertyValue ? "checked" : "unchecked"}
        onChange={this.onToggle}
        onRelease={this.onRelease}
        value={this.props.propertyValue}
      />
    );
  }

  renderAbhinavsSuggestion() {
    const max = (this.props.propertyValue || 0) + 100;
    return (
      <div style={{ display: "flex" }}>
        <AdsSlider
          className={this.props.propertyValue ? "checked" : "unchecked"}
          onChange={this.onToggle}
          onRelease={this.onRelease}
          value={this.props.propertyValue}
        />
        <StyledNumericInput
          max={max}
          min={4}
          onValueChange={this.onToggle}
          value={this.props.propertyValue}
        />
      </div>
    );
  }

  renderAbhishekSuggestion() {
    const handleRelease = () => {
      this.setState({
        showSlider: false,
      });
      this.onRelease();
    };

    return (
      <AbhisheksSuggestionContainer>
        {this.state.showSlider ? (
          <AdsSlider
            className={this.props.propertyValue ? "checked" : "unchecked"}
            onChange={this.onToggle}
            onRelease={handleRelease}
            value={this.props.propertyValue}
          />
        ) : null}
        {this.state.showSlider ? null : (
          <InputGroup
            onClick={() => this.setState({ showSlider: true })}
            value={this.props.propertyValue}
          />
        )}
      </AbhisheksSuggestionContainer>
    );
  }

  render() {
    if (this.state.feedback !== null) {
      if (this.state.feedback.main) {
        return this.renderMain();
      }

      if (this.state.feedback.abhinavsSuggesstion) {
        return this.renderAbhinavsSuggestion();
      }

      if (this.state.feedback.abhisheksSuggestion) {
        return this.renderAbhishekSuggestion();
      }
    }

    return this.renderMain();
  }

  onFeedbackChange = (state: any) => {
    this.setState({
      feedback: state,
    });
  };

  componentDidMount() {
    EventEmitter.add("feedback_change", this.onFeedbackChange);
  }

  componentWillUnmount() {
    EventEmitter.remove("feedback_change", this.onFeedbackChange);
  }

  onToggle = (value: number) => {
    this.updateProperty(this.props.propertyName, value);
    if (this.props.onChange) {
      this.props.onChange();
    }
  };

  onRelease = () => {
    if (this.props.onRelease) {
      this.props.onRelease();
    }
  };

  static getControlType() {
    return "SLIDER";
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return value === "true" || value === "false";
  }
}

export interface SliderControlProps extends ControlProps {
  onChange?: () => void;
  onRelease?: () => void;
}

export default SliderControl;
