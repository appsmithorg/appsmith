import { isEqual } from "lodash";
import React from "react";
import DraggableList from "./DraggableList";

export type BaseItemProps = {
  id: string;
  isVisible?: boolean;
  label?: string;
};

export type RenderComponentProps<TItem extends BaseItemProps> = {
  index: number;
  item: TItem;
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
  toggleVisibility?: (index: number) => void;
  onEdit?: (index: number) => void;
  updateFocus?: (index: number, isFocused: boolean) => void;
};

type DroppableComponentProps<TItem extends BaseItemProps> = {
  items: TItem[];
  itemHeight: number;
  renderComponent: (props: RenderComponentProps<TItem>) => JSX.Element;
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
  toggleVisibility?: (index: number) => void;
  updateItems: (items: TItem[]) => void;
  onEdit?: (index: number) => void;
  updateFocus?: (index: number, isFocused: boolean) => void;
};

export class DroppableComponent<
  TItem extends BaseItemProps
> extends React.Component<DroppableComponentProps<TItem>> {
  constructor(props: DroppableComponentProps<TItem>) {
    super(props);
  }

  shouldComponentUpdate(prevProps: DroppableComponentProps<TItem>) {
    const presentOrder = this.props.items.map(this.getVisibleObject);
    const previousOrder = prevProps.items.map(this.getVisibleObject);

    return !isEqual(presentOrder, previousOrder);
  }

  getVisibleObject(item: Record<string, unknown>) {
    if (!item) return {};

    return {
      id: item.id,
      label: item.label,
      isVisible: item.isVisible,
      isDuplicateLabel: item.isDuplicateLabel,
    };
  }

  onUpdate = (itemsOrder: number[]) => {
    const newOrderedItems = itemsOrder.map((each) => this.props.items[each]);
    this.props.updateItems(newOrderedItems);
  };

  renderItem = ({ index, item }: any) => {
    const {
      deleteOption,
      onEdit,
      renderComponent,
      toggleVisibility,
      updateFocus,
      updateOption,
    } = this.props;

    return renderComponent({
      deleteOption,
      updateFocus,
      updateOption,
      toggleVisibility,
      onEdit,
      item,
      index,
    });
  };

  render() {
    return (
      <DraggableList
        ItemRenderer={this.renderItem}
        itemHeight={45}
        items={this.props.items}
        onUpdate={this.onUpdate}
        shouldReRender={false}
      />
    );
  }
}
