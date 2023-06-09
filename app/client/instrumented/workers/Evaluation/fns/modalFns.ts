import { promisify } from "./utils/Promisify";

function showModalFnDescriptor(modalName: string) {
  return {
    type: "SHOW_MODAL_BY_NAME" as const,
    payload: { modalName },
  };
}

export type TShowModalArgs = Parameters<typeof showModalFnDescriptor>;
export type TShowModalDescription = ReturnType<typeof showModalFnDescriptor>;
export type TShowModalActionType = TShowModalDescription["type"];

async function showModal(...args: TShowModalArgs) {
  return promisify(showModalFnDescriptor)(...args);
}

function closeModalFnDescriptor(modalName: string) {
  return {
    type: "CLOSE_MODAL" as const,
    payload: { modalName },
  };
}

export type TCloseModalArgs = Parameters<typeof closeModalFnDescriptor>;
export type TCloseModalDescription = ReturnType<typeof closeModalFnDescriptor>;
export type TCloseModalActionType = TCloseModalDescription["type"];

async function closeModal(...args: TCloseModalArgs) {
  return promisify(closeModalFnDescriptor)(...args);
}

export { showModal, closeModal };
