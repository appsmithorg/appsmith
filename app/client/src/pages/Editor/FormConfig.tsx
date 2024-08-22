import React, { useEffect, useRef } from "react";
import type { ControlProps } from "components/formControls/BaseControl";
import type { EvaluationError } from "utils/DynamicBindingUtils";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import {
  FormLabel,
  FormInputHelperText,
  FormInputAnchor,
  FormInputErrorText,
  FormInfoText,
  FormSubtitleText,
  FormEncrytedSection,
} from "components/editorComponents/form/fields/StyledFormComponents";
import type { FormControlProps } from "./FormControl";
import { ToggleComponentToJsonHandler } from "components/editorComponents/form/ToggleComponentToJson";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import type { AppState } from "ee/reducers";
import {
  getPropertyControlFocusElement,
  shouldFocusOnPropertyControl,
} from "utils/editorContextUtils";
import { getIsInputFieldFocused } from "selectors/editorContextSelectors";
import { setFocusableInputField } from "actions/editorContextActions";
import { Icon, Tooltip } from "@appsmith/ads";

const FlexWrapper = styled.div`
  display: flex;
  width: fit-content;
  margin-right: 5px;
  min-height: 21px;

  & .t--js-toggle {
    margin-bottom: 0px;
  }
`;

const LabelWrapper = styled.div`
  display: flex;
  .label-icon-wrapper {
    &.help {
      cursor: help;
    }
  }
`;

const LabelIconWrapper = styled.span`
  display: flex;
`;

const RequiredFieldWrapper = styled.span`
  color: var(--ads-v2-color-fg-error);
`;

// TODO: replace condition with props.config.dataType === "TOGGLE"
// label and form element is rendered side by side for CHECKBOX and SWITCH
const FormConfigWrapper = styled.div<{ controlType: string }>`
  display: ${(props) =>
    props.controlType === "CHECKBOX" || props.controlType === "SWITCH"
      ? "flex"
      : "block"};
`;

interface FormConfigProps extends FormControlProps {
  children: JSX.Element;
  configErrors: EvaluationError[];
  changesViewType: boolean;
}

const controlsWithSubtitleInTop = [
  "ARRAY_FIELD",
  "WHERE_CLAUSE",
  "QUERY_DYNAMIC_TEXT",
];

// top contains label, subtitle, urltext, tooltip, display type
// bottom contains the info and error text
// props.children will render the form element
export default function FormConfig(props: FormConfigProps) {
  let top, bottom;
  const controlRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useDispatch();
  const entityInfo = identifyEntityFromPath(window.location.pathname);

  const handleOnFocus = () => {
    if (props.config.configProperty) {
      // Need an additional identifier to trigger another render when configProperty
      // are same for two different entitites
      dispatch(
        setFocusableInputField(
          `${entityInfo.id}.${props.config.configProperty}`,
        ),
      );
    }
  };

  const shouldFocusPropertyPath: boolean = useSelector((state: AppState) =>
    getIsInputFieldFocused(
      state,
      `${entityInfo.id}.${props.config.configProperty}`,
    ),
  );

  useEffect(() => {
    if (shouldFocusPropertyPath) {
      setTimeout(() => {
        if (shouldFocusOnPropertyControl(controlRef.current)) {
          const focusableElement = getPropertyControlFocusElement(
            controlRef.current,
          );
          focusableElement?.scrollIntoView({
            block: "center",
            behavior: "smooth",
          });
          focusableElement?.focus();
        }
      }, 0);
    }
  }, [shouldFocusPropertyPath]);
  if (props.multipleConfig?.length) {
    top = (
      <div style={{ display: "flex" }}>
        {props.multipleConfig?.map((config) => {
          return renderFormConfigTop({
            config,
            formName: props.formName,
            changesViewType: props.changesViewType,
          });
        })}
      </div>
    );
    bottom = props.multipleConfig?.map((config) => {
      return renderFormConfigBottom({ config });
    });
    return (
      <>
        {top}
        {props.children}
        {bottom}
      </>
    );
  }

  return (
    <div>
      <FormConfigWrapper
        controlType={props.config.controlType}
        onFocus={handleOnFocus}
        ref={controlRef}
      >
        {props.config.controlType === "CHECKBOX" ? (
          <>
            {props.children}
            {renderFormConfigTop({
              config: props.config,
              formName: props.formName,
              changesViewType: props.changesViewType,
            })}
          </>
        ) : (
          <>
            {renderFormConfigTop({
              config: props.config,
              formName: props.formName,
              changesViewType: props.changesViewType,
            })}
            {props.children}
          </>
        )}
      </FormConfigWrapper>
      {renderFormConfigBottom({
        config: props.config,
        configErrors: props.configErrors,
      })}
    </div>
  );
}

function renderFormConfigTop(props: {
  config: ControlProps;
  formName: string;
  changesViewType: boolean;
}) {
  const {
    controlType,
    encrypted,
    isRequired,
    label,
    nestedFormControl,
    subtitle,
    tooltipText = "",
    url,
    urlText,
  } = { ...props.config };
  const shouldRenderSubtitle =
    subtitle && controlsWithSubtitleInTop.includes(controlType);
  return (
    <div className="form-config-top" key={props.config.label}>
      {!nestedFormControl && // if the form control is a nested form control hide its label
        (label?.length > 0 ||
          encrypted ||
          tooltipText ||
          shouldRenderSubtitle) && (
          <>
            <FlexWrapper>
              <FormLabel
                config={props.config}
                extraStyles={{
                  marginBottom: shouldRenderSubtitle && "0px",
                  minWidth: !!props.changesViewType && "unset",
                }}
              >
                <LabelWrapper>
                  <Tooltip
                    content={tooltipText as string}
                    isDisabled={!tooltipText}
                  >
                    <p
                      className={`label-icon-wrapper ${tooltipText && "help"}`}
                    >
                      {label}
                    </p>
                  </Tooltip>
                  <LabelIconWrapper>
                    {isRequired && (
                      <RequiredFieldWrapper>
                        {isRequired && "*"}
                      </RequiredFieldWrapper>
                    )}
                    {encrypted && (
                      <FormEncrytedSection>
                        <Icon
                          color="var(--ads-v2-color-fg-success)"
                          name="lock-2-line"
                          size="sm"
                        />
                        <FormSubtitleText config={props.config}>
                          Encrypted
                        </FormSubtitleText>
                      </FormEncrytedSection>
                    )}
                  </LabelIconWrapper>
                </LabelWrapper>
              </FormLabel>
              {props.changesViewType && (
                <ToggleComponentToJsonHandler
                  configProperty={props.config.configProperty}
                  formName={props.formName}
                />
              )}
            </FlexWrapper>
            {shouldRenderSubtitle && (
              <FormInfoText config={props.config}>{subtitle}</FormInfoText>
            )}
          </>
        )}
      {urlText && (
        <FormInputAnchor href={url} target="_blank">
          {urlText}
        </FormInputAnchor>
      )}
    </div>
  );
}

function renderFormConfigBottom(props: {
  config: ControlProps;
  configErrors?: EvaluationError[];
}) {
  const { controlType, info, subtitle } = { ...props.config };
  return (
    <>
      {subtitle && !controlsWithSubtitleInTop.includes(controlType) && (
        <FormInfoText config={props.config}>{subtitle}</FormInfoText>
      )}
      {info && (
        <FormInputHelperText
          addMarginTop={controlType === "CHECKBOX" ? "8px" : "2px"} // checkboxes need a higher margin top than others form control types
        >
          {info}
        </FormInputHelperText>
      )}
      {props.configErrors &&
        props.configErrors.length > 0 &&
        props.configErrors
          .filter(
            (error) =>
              error.errorType === PropertyEvaluationErrorType.VALIDATION,
          )
          .map((error, index) => (
            <FormInputErrorText key={index}>
              {`* ${error?.errorMessage}`}
            </FormInputErrorText>
          ))}
    </>
  );
}
