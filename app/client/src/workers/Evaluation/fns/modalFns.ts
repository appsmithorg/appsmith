import { promisify } from "./utils/Promisify";

function showModalFnDescriptor(modalName: string) {
  return {
    type: "SHOW_MODAL_BY_NAME",
    payload: { modalName },
  };
}
const showModal = promisify(showModalFnDescriptor);

function closeModalFnDescriptor(modalName: string) {
  return {
    type: "CLOSE_MODAL",
    payload: { modalName },
  };
}
const closeModal = promisify(closeModalFnDescriptor);

export { showModal, closeModal };
