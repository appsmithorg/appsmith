import { isEqual } from "lodash";
import React from "react";
import DraggableList from "./DraggableList";

type RenderComponentProps = {
  index: number;
  item: {
    label: string;
    isDerived?: boolean;
  };
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
  toggleVisibility?: (index: number) => void;
  onEdit?: (index: number) => void;
  updateFocus?: (index: number, isFocused: boolean) => void;
};

interface DroppableComponentProps {
  fixedHeight?: number | boolean;
  items: Array<Record<string, unknown>>;
  itemHeight: number;
  renderComponent: (props: RenderComponentProps) => JSX.Element;
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
  toggleVisibility?: (index: number) => void;
  updateItems: (items: Array<Record<string, unknown>>) => void;
  onEdit?: (index: number) => void;
  updateFocus?: (index: number, isFocused: boolean) => void;
}

export class DroppableComponent extends React.Component<
  DroppableComponentProps
> {
  constructor(props: DroppableComponentProps) {
    super(props);
  }

  shouldComponentUpdate(prevProps: DroppableComponentProps) {
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
        fixedHeight={this.props.fixedHeight}
        itemHeight={45}
        items={this.props.items}
        onUpdate={this.onUpdate}
        shouldReRender={false}
      />
    );
  }
}
