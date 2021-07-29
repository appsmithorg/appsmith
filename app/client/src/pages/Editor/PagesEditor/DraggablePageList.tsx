import React from "react";
import { isEqual } from "lodash";

import PageListItem from "./PageListItem";
import DraggableList from "components/ads/DraggableList";
import { PageListPayload } from "constants/ReduxActionConstants";

interface DraggablePageListProps {
  items: PageListPayload;
  itemHeight: number;
  applicationId: string;
  onUpdate: any;
}

export class DraggablePageList extends React.Component<DraggablePageListProps> {
  shouldComponentUpdate(prevProps: DraggablePageListProps) {
    const presentOrder = this.props.items.map((each) => each.pageId);
    const previousOrder = prevProps.items.map((each) => each.pageId);
    return !isEqual(presentOrder, previousOrder);
  }

  onUpdate = (itemsOrder: number[]) => {
    const newOrderedItems = itemsOrder.map((each) => this.props.items[each]);
    this.props.onUpdate(newOrderedItems);
  };

  render() {
    return (
      <DraggableList
        ItemRenderer={({ item }: any) => (
          <PageListItem applicationId={this.props.applicationId} item={item} />
        )}
        itemHeight={70}
        items={this.props.items}
        onUpdate={this.props.onUpdate}
      />
    );
  }
}
