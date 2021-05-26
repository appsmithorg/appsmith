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
};

interface DroppableComponentProps {
  items: Array<Record<string, unknown>>;
  itemHeight: number;
  renderComponent: (props: RenderComponentProps) => JSX.Element;
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
  toggleVisibility?: (index: number) => void;
  updateItems: (items: Array<Record<string, unknown>>) => void;
  onEdit?: (index: number) => void;
}

export class DroppableComponent extends React.Component<
  DroppableComponentProps
> {
  constructor(props: DroppableComponentProps) {
    super(props);
  }

  shouldComponentUpdate(prevProps: DroppableComponentProps) {
    const presentOrder = this.props.items.map((each) => each.id);
    const previousOrder = prevProps.items.map((each) => each.id);
    return !isEqual(presentOrder, previousOrder);
  }

  onUpdate = (itemsOrder: number[]) => {
    const newOrderedItems = itemsOrder.map((each) => this.props.items[each]);
    this.props.updateItems(newOrderedItems);
  };

  render() {
    const {
      deleteOption,
      onEdit,
      renderComponent,
      toggleVisibility,
      updateOption,
    } = this.props;
    return (
      <DraggableList
        ItemRenderer={({ index, item }: any) =>
          renderComponent({
            deleteOption,
            updateOption,
            toggleVisibility,
            onEdit,
            item,
            index,
          })
        }
        itemHeight={45}
        items={this.props.items}
        onUpdate={this.onUpdate}
      />
    );
  }
}
