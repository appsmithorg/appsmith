import { openGeneratePageModal } from "pages/Editor/GeneratePage/store/generatePageActions";
import { put } from "redux-saga/effects";

export function* openGeneratePageModalWithSelectedDS({
  datasourceId,
  shouldOpenModalWIthSelectedDS,
}: {
  shouldOpenModalWIthSelectedDS: boolean;
  datasourceId: string;
}) {
  if (shouldOpenModalWIthSelectedDS) {
    yield put(
      openGeneratePageModal({
        datasourceId,
      }),
    );
  }
}
