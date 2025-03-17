import React from "react";
import { Field, type WrappedFieldInputProps } from "redux-form";
import BaseControl from "./BaseControl";
import type { ControlProps } from "./BaseControl";
import { Slider, type SliderProps, Flex, Switch, Text } from "@appsmith/ads";

export interface HybridSearchControlProps
  extends ControlProps,
    Omit<SliderProps, "id" | "label"> {
  // tooltipText also exists in ControlProps, but it has type of  of `string | Record<string, string>`
  // and we only need it to be a string, so we override it here
  tooltipText?: string;
}

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

  const onSliderChange = (value: number) => {
    input?.onChange({
      ...input?.value,
      keywordWeight: value,
      semanticWeight: (10 - value * 10) / 10, // Scale by 10 to avoid floating-point issues
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
      <Flex flexDirection="column">
        <Slider
          getValueLabel={() => "Semantic weight"}
          isDisabled={!input?.value.isEnabled}
          label="Keyword weight"
          maxValue={1}
          minValue={0}
          onChange={onSliderChange}
          step={0.1}
          value={input?.value.keywordWeight}
        />
        <Flex justifyContent="space-between">
          <Text>{input?.value.keywordWeight}</Text>
          <Text>{input?.value.semanticWeight}</Text>
        </Flex>
      </Flex>
    </Flex>
  );
};
