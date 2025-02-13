import React from "react";
import { Field, type WrappedFieldInputProps } from "redux-form";
import BaseControl from "./BaseControl";
import type { ControlProps } from "./BaseControl";
import { Slider, type SliderProps, Flex, Switch } from "@appsmith/ads";

export interface HybridSearchControlProps
  extends ControlProps,
    Omit<SliderProps, "id" | "label"> {}

export class HybridSearchControl extends BaseControl<HybridSearchControlProps> {
  render() {
    const { configProperty, ...rest } = this.props;

    return (
      <Field
        component={renderHybridSearchControl}
        name={configProperty}
        props={{ ...rest }}
      />
    );
  }

  getControlType(): string {
    return "HYBRID_SEARCH";
  }
}

const renderHybridSearchControl = (
  props: {
    input?: WrappedFieldInputProps;
  } & HybridSearchControlProps,
) => {
  const { input } = props;

  const onKeywordWeightChange = (value: number) => {
    input?.onChange({
      ...input?.value,
      keywordWeight: value,
      semanticWeight: (10 - value * 10) / 10, // Scale by 10 to avoid floating-point issues
    });
  };
  const onSemanticWeightChange = (value: number) => {
    input?.onChange({
      ...input?.value,
      keywordWeight: (10 - value * 10) / 10, // Scale by 10 to avoid floating-point issues
      semanticWeight: value,
    });
  };
  const onSwitchChange = (value: boolean) => {
    input?.onChange({
      ...input?.value,
      isEnabled: value,
    });
  };

  return (
    <Flex flexDirection="column" gap="spaces-4">
      <Flex width="150px">
        <Switch
          defaultSelected={input?.value.isEnabled}
          onChange={onSwitchChange}
        >
          Hybrid search
        </Switch>
      </Flex>
      <Flex alignItems="center" gap="spaces-4">
        <Slider
          isDisabled={!input?.value.isEnabled}
          label="Keyword weight"
          maxValue={1}
          minValue={0}
          onChange={onKeywordWeightChange}
          step={0.1}
          value={input?.value.keywordWeight}
        />
        <Slider
          isDisabled={!input?.value.isEnabled}
          label="Semantic weight"
          maxValue={1}
          minValue={0}
          onChange={onSemanticWeightChange}
          step={0.1}
          value={input?.value.semanticWeight}
        />
      </Flex>
    </Flex>
  );
};
