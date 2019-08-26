import BaseWidget, { IWidgetProps } from "../widgets/BaseWidget"
import ContainerWidget, {
  IContainerWidgetProps
} from "../widgets/ContainerWidget"
import TextWidget, { ITextWidgetProps } from "../widgets/TextWidget"
import InputGroupWidget, {
  IInputGroupWidgetProps
} from "../widgets/InputGroupWidget"
import CalloutWidget, { ICalloutWidgetProps } from "../widgets/CalloutWidget"
import IconWidget, { IIconWidgetProps } from "../widgets/IconWidget"
import SpinnerWidget, { ISpinnerWidgetProps } from "../widgets/SpinnerWidget"
import BreadcrumbsWidget, {
  IBreadcrumbsWidgetProps
} from "../widgets/BreadcrumbsWidget"
import TagInputWidget, { ITagInputWidgetProps } from "../widgets/TagInputWidget"
import NumericInputWidget, {
  INumericInputWidgetProps
} from "../widgets/NumericInputWidget"
import CheckboxWidget, { ICheckboxWidgetProps } from "../widgets/CheckboxWidget"
import RadioGroupWidget, {
  IRadioGroupWidgetProps
} from "../widgets/RadioGroupWidget"
import WidgetFactory from "./WidgetFactory"
import React from "react"
import ButtonWidget, { IButtonWidgetProps } from "../widgets/ButtonWidget"

class WidgetBuilderRegistry {
  static registerWidgetBuilders() {
    WidgetFactory.registerWidgetBuilder("CONTAINER_WIDGET", {
      buildWidget(
        widgetData: IContainerWidgetProps<IWidgetProps>
      ): JSX.Element {
        return <ContainerWidget {...widgetData} />
      }
    })

    WidgetFactory.registerWidgetBuilder("TEXT_WIDGET", {
      buildWidget(widgetData: ITextWidgetProps): JSX.Element {
        return <TextWidget {...widgetData} />
      }
    })

    WidgetFactory.registerWidgetBuilder("BUTTON_WIDGET", {
      buildWidget(widgetData: IButtonWidgetProps): JSX.Element {
        return <ButtonWidget {...widgetData} />
      }
    })

    WidgetFactory.registerWidgetBuilder("CALLOUT_WIDGET", {
      buildWidget(widgetData: ICalloutWidgetProps): JSX.Element {
        return <CalloutWidget {...widgetData} />
      }
    })

    WidgetFactory.registerWidgetBuilder("ICON_WIDGET", {
      buildWidget(widgetData: IIconWidgetProps): JSX.Element {
        return <IconWidget {...widgetData} />
      }
    })

    WidgetFactory.registerWidgetBuilder("SPINNER_WIDGET", {
      buildWidget(widgetData: ISpinnerWidgetProps): JSX.Element {
        return <SpinnerWidget {...widgetData} />
      }
    })

    WidgetFactory.registerWidgetBuilder("INPUT_GROUP_WIDGET", {
      buildWidget(widgetData: IInputGroupWidgetProps): JSX.Element {
        return <InputGroupWidget {...widgetData} />
      }
    })

    WidgetFactory.registerWidgetBuilder("BREADCRUMBS_WIDGET", {
      buildWidget(widgetData: IBreadcrumbsWidgetProps): JSX.Element {
        return <BreadcrumbsWidget {...widgetData} />
      }
    })

    WidgetFactory.registerWidgetBuilder("TAG_INPUT_WIDGET", {
      buildWidget(widgetData: ITagInputWidgetProps): JSX.Element {
        return <TagInputWidget {...widgetData} />
      }
    })

    WidgetFactory.registerWidgetBuilder("NUMERIC_INPUT_WIDGET", {
      buildWidget(widgetData: INumericInputWidgetProps): JSX.Element {
        return <NumericInputWidget {...widgetData} />
      }
    })

    WidgetFactory.registerWidgetBuilder("CHECKBOX_WIDGET", {
      buildWidget(widgetData: ICheckboxWidgetProps): JSX.Element {
        return <CheckboxWidget {...widgetData} />
      }
    })

    WidgetFactory.registerWidgetBuilder("RADIO_GROUP_WIDGET", {
      buildWidget(widgetData: IRadioGroupWidgetProps): JSX.Element {
        return <RadioGroupWidget {...widgetData} />
      }
    })
    
  }
}

export default WidgetBuilderRegistry
