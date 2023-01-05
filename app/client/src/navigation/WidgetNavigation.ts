import { FocusEntity, identifyEntityFromPath } from "navigation/FocusEntity";
import history from "utils/history";
import { builderURL } from "RouteBuilder";

class WidgetNavigation {
  public singleSelect(widgetId: string): void {
    try {
      this.updateSelection([widgetId]);
    } catch (e) {
      //pass
    }
  }

  public appendSelection(widgetId: string): void {
    try {
      const currentSelection = this.getCurrentSelection();
      const newSelection = Array.from(new Set([...currentSelection, widgetId]));
      this.updateSelection(newSelection);
    } catch (e) {
      //pass
    }
  }

  public removeSelection(widgetId: string): void {
    try {
      const currentSelection = this.getCurrentSelection();
      const newSelection = currentSelection.filter((id) => id === widgetId);
      this.updateSelection(newSelection);
    } catch (e) {
      //pass
    }
  }

  public multiSelect(widgetIds: string[]): void {
    try {
      this.updateSelection(widgetIds);
    } catch (e) {
      // pass
    }
  }

  public deselectAll(): void {
    try {
      this.updateSelection([]);
    } catch (e) {
      // pass
    }
  }

  private updateSelection(widgetIds: string[]): void {
    const pageId = this.getEntityInfo().pageId;
    if (!pageId) {
      throw Error("No page id found");
    }
    history.push(
      builderURL({
        pageId,
        hash: widgetIds.join(","),
      }),
    );
  }

  private getEntityInfo() {
    const { hash, pathname } = window.location;
    return identifyEntityFromPath(pathname, hash);
  }

  private getCurrentSelection(): string[] {
    const entityInfo = this.getEntityInfo();
    if (entityInfo.entity === FocusEntity.PROPERTY_PANE) {
      return entityInfo.id.split(",");
    }
    return [];
  }
}

export default new WidgetNavigation();
