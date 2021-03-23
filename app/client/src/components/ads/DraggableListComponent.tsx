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
  renderComponent: (props: RenderComponentProps) => JSX.Element;
  deleteOption: (index: number) => void;
  updateOption: (index: number, value: string) => void;
  toggleVisibility?: (index: number) => void;
  updateItems: (items: Array<Record<string, unknown>>) => void;
  onEdit?: (index: number) => void;
}

interface DroppableComponentState {
  items: Array<Record<string, unknown>>;
}

export class DroppableComponent extends React.Component<
  DroppableComponentProps,
  DroppableComponentState
> {
  constructor(props: DroppableComponentProps) {
    super(props);
    this.state = {
      items: props.items,
    };
  }

  componentDidUpdate(prevProps: DroppableComponentProps) {
    if (this.props.items.length !== prevProps.items.length) {
      this.setState({ items: this.props.items });
    } else if (
      JSON.stringify(this.props.items) !== JSON.stringify(prevProps.items)
    ) {
      this.setState({ items: this.props.items });
    }
  }

  onUpdate = (items: any) => {
    this.setState({ items: items });
    this.props.updateItems(items);
  };

  render() {
    const {
      renderComponent,
      deleteOption,
      updateOption,
      toggleVisibility,
      onEdit,
    } = this.props;
    return (
      <>
        <DraggableList
          ItemRenderer={({ item, index }: any) =>
            renderComponent({
              deleteOption,
              updateOption,
              toggleVisibility,
              onEdit,
              item,
              index,
            })
          }
          items={this.props.items}
          onUpdate={this.onUpdate}
        />
      </>
    );
  }
}
