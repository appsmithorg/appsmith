import type { SetCrudInfoModalOpenPayload } from "../../actions/crudInfoModalActions";

export interface GenerateCRUDSuccessInfoData {
  successImageUrl: string;
  successMessage: string;
}

export interface CrudInfoModalReduxState {
  crudInfoModalOpen: boolean;
  generateCRUDSuccessInfo: GenerateCRUDSuccessInfoData | null;
}
