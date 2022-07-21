import { SwitchFactory } from "./SwitchFactory";
import { ButtonFactory } from "./ButtonFactory";
import { TextFactory } from "./TextFactory";
import { ImageFactory } from "./ImageFactory";
import { InputFactory } from "./InputFactory";
import { TableFactory } from "./TableFactory";
import { OldDatepickerFactory, DatepickerFactory } from "./DatepickerFactory";
import { ContainerFactory } from "./ContainerFactory";
import { DropdownFactory } from "./DropdownFactory";
import { CheckboxFactory } from "./CheckboxFactory";
import { RadiogroupFactory } from "./RadiogroupFactory";
import { OldTabsFactory, TabsFactory } from "./TabsFactory";
import { ModalFactory } from "./ModalFactory";
import { RichTextFactory } from "./RichTextFactory";
import { ChartFactory } from "./ChartFactory";
import { FormFactory } from "./FormFactory";
import { FormButtonFactory } from "./FormButtonFactory";
import { MapFactory } from "./MapFactory";
import { CanvasFactory } from "./CanvasFactory";
import { IconFactory } from "./IconFactory";
import { FilepickerFactory } from "./FilepickerFactory";
import { VideoFactory } from "./VideoFactory";
import { SkeletonFactory } from "./SkeletonFactory";
import { ListFactory } from "./ListFactory";
import { DividerFactory } from "./DividerFactory";

export const WidgetTypeFactories: Record<string, any> = {
  SWITCH_WIDGET: SwitchFactory,
  BUTTON_WIDGET: ButtonFactory,
  TEXT_WIDGET: TextFactory,
  IMAGE_WIDGET: ImageFactory,
  INPUT_WIDGET_V2: InputFactory,
  CONTAINER_WIDGET: ContainerFactory,
  DATE_PICKER_WIDGET: OldDatepickerFactory,
  DATE_PICKER_WIDGET2: DatepickerFactory,
  TABLE_WIDGET: TableFactory,
  SELECT_WIDGET: DropdownFactory,
  CHECKBOX_WIDGET: CheckboxFactory,
  RADIO_GROUP_WIDGET: RadiogroupFactory,
  TABS_WIDGET: TabsFactory,
  TABS_MIGRATOR_WIDGET: OldTabsFactory,
  MODAL_WIDGET: ModalFactory,
  RICH_TEXT_EDITOR_WIDGET: RichTextFactory,
  CHART_WIDGET: ChartFactory,
  FORM_WIDGET: FormFactory,
  FORM_BUTTON_WIDGET: FormButtonFactory,
  MAP_WIDGET: MapFactory,
  CANVAS_WIDGET: CanvasFactory,
  ICON_WIDGET: IconFactory,
  FILE_PICKER_WIDGET: FilepickerFactory,
  VIDEO_WIDGET: VideoFactory,
  SKELETON_WIDGET: SkeletonFactory,
  LIST_WIDGET: ListFactory,
  DIVIDER_WIDGET: DividerFactory,
};
