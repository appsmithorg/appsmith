import type { RecentEntity, SearchCategory } from "../../components/editorComponents/GlobalSearch/utils";

export interface GlobalSearchReduxState {
  query: string;
  modalOpen: boolean;
  recentEntities: Array<RecentEntity>;
  recentEntitiesRestored: boolean;
  filterContext: {
    category: SearchCategory;
  };
}
