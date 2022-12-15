import React, { useEffect, useRef } from "react";
import { ControlProps } from "components/formControls/BaseControl";
import {
  EvaluationError,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { TooltipComponent as Tooltip } from "design-system";
import {
  FormLabel,
  FormInputHelperText,
  FormInputAnchor,
  FormInputErrorText,
  FormInfoText,
  FormSubtitleText,
  FormEncrytedSection,
} from "components/editorComponents/form/fields/StyledFormComponents";
import { FormIcons } from "icons/FormIcons";
import { FormControlProps } from "./FormControl";
import { ToggleComponentToJsonHandler } from "components/editorComponents/form/ToggleComponentToJson";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { AppState } from "@appsmith/reducers";
import {
  getPropertyControlFocusElement,
  shouldFocusOnPropertyControl,
} from "utils/editorContextUtils";
import { getIsInputFieldFocused } from "selectors/editorContextSelectors";
import { setFocusableInputField } from "actions/editorContextActions";

const FlexWrapper = styled.div`
  display: flex;
  width: fit-content;
  margin-right: 16px;
  & .t--js-toggle {
    margin-bottom: 0px;
  }
`;

const LabelWrapper = styled.div`
  display: flex;
`;

const LabelIconWrapper = styled.span`
  display: flex;
`;

const RequiredFieldWrapper = styled.span`
  color: var(--appsmith-color-red-500);
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
// top contains label, subtitle, urltext, tooltip, dispaly type
// bottom contains the info and error text
// props.children will render the form element
export default function FormConfig(props: FormConfigProps) {
  let top, bottom;
  const controlRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useDispatch();
  const entityInfo = identifyEntityFromPath(
    window.location.pathname,
    window.location.hash,
  );

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
    encrypted,
    isRequired,
    label,
    nestedFormControl,
    subtitle,
    tooltipText = "",
    url,
    urlText,
  } = { ...props.config };
  return (
    <div className="form-config-top" key={props.config.label}>
      {!nestedFormControl && // if the form control is a nested form control hide its label
        (label?.length > 0 || encrypted || tooltipText || subtitle) && (
          <>
            <FlexWrapper>
              <FormLabel
                config={props.config}
                extraStyles={{
                  marginBottom: !!subtitle && "0px",
                  minWidth: !!props.changesViewType && "unset",
                }}
              >
                <LabelWrapper>
                  <Tooltip
                    content={tooltipText as string}
                    disabled={!tooltipText}
                    hoverOpenDelay={200}
                    underline={!!tooltipText}
                  >
                    <p className="label-icon-wrapper">{label}</p>
                  </Tooltip>
                  <LabelIconWrapper>
                    {isRequired && (
                      <RequiredFieldWrapper>
                        {isRequired && "*"}
                      </RequiredFieldWrapper>
                    )}
                    {encrypted && (
                      <FormEncrytedSection>
                        <FormIcons.LOCK_ICON
                          height={12}
                          keepColors
                          width={12}
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
            {subtitle && (
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
  const { controlType, info } = { ...props.config };
  return (
    <>
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
