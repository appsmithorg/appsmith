import React from "react";
import equal from "fast-deep-equal/es6";
import { debounce, difference, isEmpty, noop, merge } from "lodash";
import { klona } from "klona";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import JSONFormComponent from "../component";
import { contentConfig, styleConfig } from "./propertyConfig";
import type { DerivedPropertiesMap } from "utils/WidgetFactory";
import type { ExecuteTriggerPayload } from "constants/AppsmithActionConstants/ActionConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { FieldState, FieldThemeStylesheet, Schema } from "../constants";
import { ActionUpdateDependency, ROOT_SCHEMA_KEY } from "../constants";
import {
  ComputedSchemaStatus,
  computeSchema,
  dynamicPropertyPathListFromSchema,
  generateFieldState,
} from "./helper";
import type { ButtonStyleProps } from "widgets/ButtonWidget/component";
import type { BoxShadow } from "components/designSystems/appsmith/WidgetStyleContainer";
import { convertSchemaItemToFormData } from "../helper";
import type {
  ButtonStyles,
  ChildStylesheet,
  Stylesheet,
} from "entities/AppTheming";
import type { BatchPropertyUpdatePayload } from "actions/controlActions";
import { isAutoHeightEnabledForWidget } from "widgets/WidgetUtils";
import { generateTypeDef } from "utils/autocomplete/dataTreeTypeDefCreator";
import type { AutocompletionDefinitions } from "widgets/constants";

export interface JSONFormWidgetProps extends WidgetProps {
  autoGenerateForm?: boolean;
  borderColor?: string;
  borderRadius?: number;
  boxShadow?: BoxShadow;
  boxShadowColor?: string;
  canvasWidgets: Record<string, WidgetProps>;
  disabledWhenInvalid?: boolean;
  fieldLimitExceeded: boolean;
  fieldState: Record<string, unknown>;
  fixedFooter: boolean;
  formData: Record<string, unknown>;
  isVisible: boolean;
  onSubmit?: string;
  resetButtonLabel: string;
  resetButtonStyles: ButtonStyleProps;
  schema: Schema;
  scrollContents: boolean;
  showReset: boolean;
  sourceData?: Record<string, unknown>;
  useSourceData?: boolean;
  submitButtonLabel: string;
  submitButtonStyles: ButtonStyleProps;
  title: string;
  childStylesheet: FieldThemeStylesheet;
}

export type MetaInternalFieldState = FieldState<{
  isValid: boolean;
  filterText?: string;
}>;

export type JSONFormWidgetState = {
  resetObserverCallback: () => void;
  isSubmitting: boolean;
  metaInternalFieldState: MetaInternalFieldState;
};

export type Action = ExecuteTriggerPayload & {
  updateDependencyType?: ActionUpdateDependency;
};

const SAVE_FIELD_STATE_DEBOUNCE_TIMEOUT = 400;

class JSONFormWidget extends BaseWidget<
  JSONFormWidgetProps,
  WidgetState & JSONFormWidgetState
> {
  debouncedParseAndSaveFieldState: any;
  isWidgetMounting: boolean;
  actionQueue: Action[];

  constructor(props: JSONFormWidgetProps) {
    super(props);

    this.debouncedParseAndSaveFieldState = debounce(
      this.parseAndSaveFieldState,
      SAVE_FIELD_STATE_DEBOUNCE_TIMEOUT,
    );

    this.isWidgetMounting = true;
    this.actionQueue = [];
  }
  formRef = React.createRef<HTMLDivElement>();

  state = {
    resetObserverCallback: noop,
    isSubmitting: false,
    metaInternalFieldState: {},
  };

  static getPropertyPaneContentConfig() {
    return contentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      formData: {},
      fieldState: {},
    };
  }

  static getStylesheetConfig(): Stylesheet<ChildStylesheet & ButtonStyles> {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",

      submitButtonStyles: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none",
      },

      resetButtonStyles: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none",
      },

      childStylesheet: {
        ARRAY: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
          cellBorderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          cellBoxShadow: "none",
        },
        OBJECT: {
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
          cellBorderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          cellBoxShadow: "none",
        },
        CHECKBOX: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        },
        CURRENCY_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        DATEPICKER: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        EMAIL_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        MULTISELECT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        MULTILINE_TEXT_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        NUMBER_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        PASSWORD_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        PHONE_NUMBER_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        RADIO_GROUP: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          boxShadow: "none",
        },
        SELECT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        SWITCH: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          boxShadow: "none",
        },
        TEXT_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return (widget: JSONFormWidgetProps) => ({
      "!doc":
        "JSON Form widget can be used to auto-generate forms by providing a JSON source data.",
      // TODO: Update the url
      "!url": "https://docs.appsmith.com/widget-reference",
      formData: generateTypeDef(widget.formData),
      sourceData: generateTypeDef(widget.sourceData),
      fieldState: generateTypeDef(widget.fieldState),
      isValid: "bool",
    });
  }

  static defaultProps = {};

  componentDidMount() {
    this.constructAndSaveSchemaIfRequired();
  }

  componentDidUpdate(prevProps: JSONFormWidgetProps) {
    super.componentDidUpdate(prevProps);
    if (
      isEmpty(this.props.formData) &&
      isEmpty(this.props.fieldState) &&
      !isEmpty(prevProps.fieldState)
    ) {
      this.state.resetObserverCallback(this.props.schema);
    }

    if (prevProps.useSourceData !== this.props.useSourceData) {
      const { formData } = this.props;
      this.updateFormData(formData);
    }

    const { schema } = this.constructAndSaveSchemaIfRequired(prevProps);
    this.debouncedParseAndSaveFieldState(
      this.state.metaInternalFieldState,
      schema,
    );
  }

  deferredComponentDidRender() {
    this.isWidgetMounting = false;
  }

  computeDynamicPropertyPathList = (schema: Schema) => {
    const pathListFromSchema = dynamicPropertyPathListFromSchema(schema);
    const pathListFromProps = (this.props.dynamicPropertyPathList || []).map(
      ({ key }) => key,
    );

    const newPaths = difference(pathListFromSchema, pathListFromProps);

    return [...pathListFromProps, ...newPaths].map((path) => ({ key: path }));
  };

  getPreviousSourceData = (prevProps?: JSONFormWidgetProps) => {
    // The autoGenerate flag was switched on.
    if (!prevProps?.autoGenerateForm && this.props.autoGenerateForm) {
      const rootSchemaItem =
        this.props.schema && this.props.schema[ROOT_SCHEMA_KEY];

      return rootSchemaItem?.sourceData || {};
    }

    return prevProps?.sourceData;
  };

  /**
   * Why this computation cannot be done in the updateHook of the sourceData property
   *
   * For the case where a binding is used for the sourceData eg {{Table1.selectedRow}},
   * we would have to look at the __evaluation__ object to find the evaluated value of this
   * property but as the updateHook runs before the evaluations evaluate the {{Table1.selectedRow}}
   * we would get stale/previous data from the __evaluations__ object.
   * So it will always stay 1 step behind the actual value.
   */
  constructAndSaveSchemaIfRequired = (prevProps?: JSONFormWidgetProps) => {
    if (!this.props.autoGenerateForm)
      return {
        status: ComputedSchemaStatus.UNCHANGED,
        schema: this.props?.schema || {},
      };

    const prevSourceData = this.getPreviousSourceData(prevProps);
    const currSourceData = this.props?.sourceData;

    const computedSchema = computeSchema({
      currentDynamicPropertyPathList: this.props.dynamicPropertyPathList,
      currSourceData,
      prevSchema: this.props?.schema,
      prevSourceData,
      widgetName: this.props.widgetName,
      fieldThemeStylesheets: this.props.childStylesheet,
    });
    const {
      dynamicPropertyPathList,
      modifiedSchemaItems,
      removedSchemaItems,
      schema,
      status,
    } = computedSchema;

    if (
      status === ComputedSchemaStatus.LIMIT_EXCEEDED &&
      !this.props.fieldLimitExceeded
    ) {
      this.updateWidgetProperty("fieldLimitExceeded", true);
    } else if (status === ComputedSchemaStatus.UPDATED) {
      const payload: BatchPropertyUpdatePayload = {
        modify: {
          dynamicPropertyPathList,
          fieldLimitExceeded: false,
        },
      };

      /**
       * This means there was no schema before and the computeSchema returns a
       * fresh schema than can be directly updated.
       */
      if (isEmpty(this.props?.schema)) {
        payload.modify = {
          ...payload.modify,
          schema,
        };
      } else {
        payload.modify = {
          ...payload.modify,
          ...modifiedSchemaItems,
        };

        payload.remove = removedSchemaItems;
      }

      this.batchUpdateWidgetProperty(payload);
    }

    return computedSchema;
  };

  updateFormData = (values: any, skipConversion = false) => {
    const rootSchemaItem = this.props.schema[ROOT_SCHEMA_KEY];
    const { sourceData, useSourceData } = this.props;
    let formData = values;

    if (!skipConversion) {
      formData = convertSchemaItemToFormData(rootSchemaItem, values, {
        fromId: "identifier",
        toId: "accessor",
        useSourceData,
        sourceData,
      });
    }

    this.props.updateWidgetMetaProperty("formData", formData);

    if (this.actionQueue.length) {
      this.actionQueue.forEach(({ updateDependencyType, ...actionPayload }) => {
        if (updateDependencyType === ActionUpdateDependency.FORM_DATA) {
          const payload = this.applyGlobalContextToAction(actionPayload, {
            formData,
          });

          super.executeAction(payload);
        }
      });

      this.actionQueue = this.actionQueue.filter(
        ({ updateDependencyType }) =>
          updateDependencyType !== ActionUpdateDependency.FORM_DATA,
      );
    }
  };

  parseAndSaveFieldState = (
    metaInternalFieldState: MetaInternalFieldState,
    schema: Schema,
    afterUpdateAction?: ExecuteTriggerPayload,
  ) => {
    const fieldState = generateFieldState(schema, metaInternalFieldState);
    const action = klona(afterUpdateAction);

    const actionPayload =
      action && this.applyGlobalContextToAction(action, { fieldState });

    if (!equal(fieldState, this.props.fieldState)) {
      this.props.updateWidgetMetaProperty(
        "fieldState",
        fieldState,
        actionPayload,
      );
    }
  };

  onSubmit = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.stopPropagation();
    event.preventDefault();

    if (this.props.onSubmit) {
      this.setState({
        isSubmitting: true,
      });

      super.executeAction({
        triggerPropertyName: "onSubmit",
        dynamicString: this.props.onSubmit,
        event: {
          type: EventType.ON_SUBMIT,
          callback: this.handleSubmitResult,
        },
      });
    }
  };

  handleSubmitResult = () => {
    this.setState({
      isSubmitting: false,
    });
  };

  applyGlobalContextToAction = (
    actionPayload: ExecuteTriggerPayload,
    context: Record<string, unknown> = {},
  ) => {
    const payload = klona(actionPayload);
    const { globalContext } = payload;

    /**
     * globalContext from the actionPayload takes precedence as it may have latest
     * values compared the ones coming from props
     * */
    payload.globalContext = merge(
      {},
      {
        formData: this.props.formData,
        fieldState: this.props.fieldState,
        sourceData: this.props.sourceData,
      },
      context,
      globalContext,
    );

    return payload;
  };

  onExecuteAction = (action: Action) => {
    const { updateDependencyType, ...actionPayload } = action;

    if (!updateDependencyType) {
      const payload = this.applyGlobalContextToAction(actionPayload);

      super.executeAction(payload);
    } else {
      this.actionQueue.push(action);
    }
  };

  onUpdateWidgetProperty = (propertyName: string, propertyValue: any) => {
    this.updateWidgetProperty(propertyName, propertyValue);
  };

  onUpdateWidgetMetaProperty = (propertyName: string, propertyValue: any) => {
    this.props.updateWidgetMetaProperty(propertyName, propertyValue);
  };

  setMetaInternalFieldState = (
    updateCallback: (prevState: JSONFormWidgetState) => JSONFormWidgetState,
    afterUpdateAction?: ExecuteTriggerPayload,
  ) => {
    this.setState((prevState) => {
      const newState = updateCallback(prevState);

      this.parseAndSaveFieldState(
        newState.metaInternalFieldState,
        this.props.schema,
        afterUpdateAction,
      );

      return newState;
    });
  };

  registerResetObserver = (callback: () => void) => {
    this.setState({ resetObserverCallback: callback });
  };

  unregisterResetObserver = () => {
    this.setState({ resetObserverCallback: noop });
  };

  getFormData = () => this.props.formData;

  onFormValidityUpdate = (isValid: boolean) => {
    this.props.updateWidgetMetaProperty("isValid", isValid);
  };

  getPageView() {
    const isAutoHeightEnabled = isAutoHeightEnabledForWidget(this.props);
    return (
      // Warning!!! Do not ever introduce formData as a prop directly,
      // it would lead to severe performance degradation due to frequent
      // re-rendering.
      <JSONFormComponent
        backgroundColor={this.props.backgroundColor}
        borderColor={this.props.borderColor}
        borderRadius={this.props.borderRadius}
        borderWidth={this.props.borderWidth}
        boxShadow={this.props.boxShadow}
        boxShadowColor={this.props.boxShadowColor}
        disabledWhenInvalid={this.props.disabledWhenInvalid}
        executeAction={this.onExecuteAction}
        fieldLimitExceeded={this.props.fieldLimitExceeded}
        fixMessageHeight={isAutoHeightEnabled}
        fixedFooter={this.props.fixedFooter}
        getFormData={this.getFormData}
        isSubmitting={this.state.isSubmitting}
        isWidgetMounting={this.isWidgetMounting}
        onFormValidityUpdate={this.onFormValidityUpdate}
        onSubmit={this.onSubmit}
        ref={this.formRef}
        registerResetObserver={this.registerResetObserver}
        renderMode={this.props.renderMode}
        resetButtonLabel={this.props.resetButtonLabel}
        resetButtonStyles={this.props.resetButtonStyles}
        schema={this.props.schema}
        scrollContents={this.props.scrollContents}
        setMetaInternalFieldState={this.setMetaInternalFieldState}
        showReset={this.props.showReset}
        submitButtonLabel={this.props.submitButtonLabel}
        submitButtonStyles={this.props.submitButtonStyles}
        title={this.props.title}
        unregisterResetObserver={this.unregisterResetObserver}
        updateFormData={this.updateFormData}
        updateWidgetMetaProperty={this.onUpdateWidgetMetaProperty}
        updateWidgetProperty={this.onUpdateWidgetProperty}
        widgetId={this.props.widgetId}
      />
    );
  }

  static getWidgetType(): string {
    return "JSON_FORM_WIDGET";
  }
}

export default JSONFormWidget;
