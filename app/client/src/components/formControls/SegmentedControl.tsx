import React from "react";
import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import styled from "styled-components";
import type { ControlType } from "constants/PropertyControlConstants";
import { isNil } from "lodash";
import type { WrappedFieldInputProps, WrappedFieldMetaProps } from "redux-form";
import { Field } from "redux-form";
import { connect } from "react-redux";
import type { DefaultRootState } from "react-redux";
import { getDynamicFetchedValues } from "selectors/formSelectors";
import { change, getFormValues } from "redux-form";
import type { Action } from "entities/Action";
import type { SelectOptionProps } from "@appsmith/ads";
import { SegmentedControl } from "@appsmith/ads";

const SegmentedControlWrapper = styled.div<{
  width: string;
}>`
  /* font-size: 14px; */
  width: ${(props) => (props?.width ? props?.width : "270px")};
`;

class SegementedControl extends BaseControl<Props> {
  render() {
    const styles = {
      // width: "280px",
      ...("customStyles" in this.props &&
      typeof this.props.customStyles === "object"
        ? this.props.customStyles
        : {}),
    };

    return (
      <SegmentedControlWrapper
        className={`t--${this?.props?.configProperty}`}
        data-testid={this.props.configProperty}
        style={styles}
        width={styles.width}
      >
        <Field
          component={renderSegementedControl}
          name={this.props.configProperty}
          props={{ ...this.props, width: styles.width }}
        />
      </SegmentedControlWrapper>
    );
  }

  getControlType(): ControlType {
    return "SEGMENTED_CONTROL";
  }
}

function renderSegementedControl(
  props: {
    input?: WrappedFieldInputProps;
    meta?: Partial<WrappedFieldMetaProps>;
    width: string;
  } & SegmentedControlProps,
): JSX.Element {
  let selectedValue: string;

  //Update selected value
  if (isNil(props.input?.value)) {
    selectedValue = props?.initialValue ? (props.initialValue as string) : "";
  } else {
    selectedValue = props.input?.value;
  }

  let options: SelectOptionProps[] = [];

  if (typeof props.options === "object" && Array.isArray(props.options)) {
    options = props.options;
  }

  //Function to handle selection of options
  const onSelectOptions = (value: string | undefined) => {
    if (!isNil(value)) {
      if (!(selectedValue === value)) {
        selectedValue = value;
        props.input?.onChange(selectedValue);
      }
    }
  };

  const segmentedOptions = options.map((e) => {
    return { label: e.label, value: e.value };
  });

  return (
    <SegmentedControl
      defaultValue={props.initialValue as string}
      isFullWidth
      onChange={(value) => onSelectOptions(value)}
      options={segmentedOptions}
      value={selectedValue}
    />
  );
}

export interface SegmentedControlProps extends ControlProps {
  options: SelectOptionProps[];
  optionWidth?: string;
  placeholderText: string;
  propertyValue: string;
  fetchOptionsConditionally?: boolean;
  isLoading: boolean;
  formValues: Partial<Action>;
}

interface ReduxDispatchProps {
  updateConfigPropertyValue: (
    formName: string,
    field: string,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
  ) => void;
}

type Props = SegmentedControlProps & ReduxDispatchProps;

const mapStateToProps = (
  state: DefaultRootState,
  ownProps: SegmentedControlProps,
): {
  isLoading: boolean;
  options: SelectOptionProps[];
  formValues: Partial<Action>;
} => {
  // Added default options to prevent error when options is undefined
  let isLoading = false;
  let options = ownProps.fetchOptionsConditionally ? [] : ownProps.options;
  const formValues: Partial<Action> = getFormValues(ownProps.formName)(state);

  try {
    if (ownProps.fetchOptionsConditionally) {
      const dynamicFetchedValues = getDynamicFetchedValues(state, ownProps);

      isLoading = dynamicFetchedValues.isLoading;
      options = dynamicFetchedValues.data;
    }
  } catch (e) {
  } finally {
    return { isLoading, options, formValues };
  }
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateConfigPropertyValue: (formName: string, field: string, value: any) => {
    dispatch(change(formName, field, value));
  },
});

// Connecting this component to the state to allow for dynamic fetching of options to be updated.
export default connect(mapStateToProps, mapDispatchToProps)(SegementedControl);
