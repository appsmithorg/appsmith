import equal from "fast-deep-equal/es6";
import React from "react";
import { DraggableList } from "@appsmith/ads-old";

export interface BaseItemProps {
  id: string;
  isVisible?: boolean;
  label: string;
  isDuplicateLabel?: boolean;
  isChecked?: boolean;
  isDragDisabled?: boolean;
}

export interface RenderComponentProps<TItem extends BaseItemProps> {
  focusedIndex: number | null | undefined;
  index: number;
  item: TItem;
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
  toggleCheckbox?: (index: number, checked: boolean) => void;
  toggleVisibility?: (index: number) => void;
  onEdit?: (index: number) => void;
  updateFocus?: (index: number, isFocused: boolean) => void;
  isDragging: boolean;
  isDelete?: boolean;
}

export interface DroppableComponentProps<TItem extends BaseItemProps> {
  className?: string;
  fixedHeight?: number | boolean;
  focusedIndex: number | null | undefined;
  items: TItem[];
  itemHeight: number;
  renderComponent: (props: RenderComponentProps<TItem>) => JSX.Element;
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
  toggleCheckbox?: (index: number, checked: boolean) => void;
  toggleVisibility?: (index: number) => void;
  updateItems: (items: TItem[]) => void;
  onEdit?: (index: number) => void;
  updateFocus?: (index: number, isFocused: boolean) => void;
  keyAccessor?: string;
}

export class DroppableComponent<
  TItem extends BaseItemProps,
> extends React.Component<DroppableComponentProps<TItem>> {
  constructor(props: DroppableComponentProps<TItem>) {
    super(props);
  }

  public readonly state = {
    isDragging: false,
  };

  shouldComponentUpdate(
    prevProps: DroppableComponentProps<TItem>,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prevState: any,
  ) {
    const presentOrder = this.props.items.map(this.getVisibleObject);
    const previousOrder = prevProps.items.map(this.getVisibleObject);

    return (
      !equal(presentOrder, previousOrder) ||
      this.props.focusedIndex !== prevProps.focusedIndex ||
      prevState.isDragging !== this.state.isDragging
    );
  }

  getVisibleObject(item: TItem) {
    if (!item) return {};

    return {
      id: item.id,
      label: item.label,
      isVisible: item.isVisible,
      isDuplicateLabel: item.isDuplicateLabel,
      isChecked: item.isChecked,
      isDragDisabled: item?.isDragDisabled,
    };
  }

  onUpdate = (
    itemsOrder: number[],
    originalIndex: number,
    newIndex: number,
  ) => {
    const newOrderedItems = itemsOrder.map((each) => this.props.items[each]);

    this.props.updateItems(newOrderedItems);

    if (this.props.updateFocus && originalIndex !== newIndex) {
      this.props.updateFocus(newIndex, true);
    }
  };

  updateDragging = (isDragging: boolean) => {
    this.setState({ isDragging });
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderItem = ({ index, item }: any) => {
    const {
      deleteOption,
      focusedIndex,
      onEdit,
      renderComponent,
      toggleCheckbox,
      toggleVisibility,
      updateFocus,
      updateOption,
    } = this.props;

    return renderComponent({
      deleteOption,
      updateFocus,
      updateOption,
      toggleCheckbox,
      toggleVisibility,
      onEdit,
      focusedIndex,
      item,
      index,
      isDragging: this.state.isDragging,
    });
  };

  render() {
    return (
      <DraggableList
        ItemRenderer={this.renderItem}
        className={this.props.className}
        fixedHeight={this.props.fixedHeight}
        focusedIndex={this.props.focusedIndex}
        itemHeight={45}
        items={this.props.items}
        keyAccessor={this.props?.keyAccessor}
        onUpdate={this.onUpdate}
        shouldReRender={false}
        updateDragging={this.updateDragging}
      />
    );
  }
}
