import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import React, { useCallback, useState } from "react";

import Checkbox from "components/ads/Checkbox";
import CloseIcon from "remixicon-react/CloseLineIcon";
import Button, { Category, Size } from "components/ads/Button";

interface SaveThemeModalProps {
  isOpen: boolean;
  onClose(): void;
}

interface SaveThemeFormProps {
  name: string;
}

function SaveThemeModal(props: SaveThemeModalProps) {
  const { isOpen, onClose } = props;
  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm();

  const onSubmit = useCallback((data: SaveThemeFormProps) => {
    //
  }, []);

  return <div />;

  // return (
  // <Modal isCentered isOpen={isOpen} onClose={onClose}>
  //   <ModalOverlay />
  //   <ModalContent>
  //     <form data-cy="save-theme-form">
  //       <ModalHeader>
  //         <div className="flex justify-between px-6 py-6">
  //           <h2 className="text-xl">Save Theme</h2>
  //           <button onClick={onClose}>
  //             <CloseIcon className="w-6 h-6" />
  //           </button>
  //         </div>
  //       </ModalHeader>
  //       <ModalBody>
  //         <div className="px-6 pb-6 border-b">
  //           <p>
  //             You can save your custom themes to use across applications and
  //             use them when you need.
  //           </p>
  //           <div className="mt-4 space-y-2">
  //             <h3 className="text-gray-700">Your theme name</h3>
  //             <input
  //               {...register("name")}
  //               autoFocus
  //               name="name"
  //               placeholder="My theme"
  //             />
  //           </div>
  //         </div>
  //         <div className="p-6">
  //           <p className="text-base">Want to share your customised theme?</p>
  //           <p className="mt-2 text-gray-600">
  //             You can submit your theme to Appsmith to be included in our as
  //             part of our prefined themes.
  //           </p>
  //           <div className="mt-3">
  //             <Checkbox label="Submit this theme to Appsmith" />
  //           </div>
  //         </div>
  //       </ModalBody>
  //       <ModalFooter justifyContent="flex-start">
  //         <div className="px-6 pt-4 pb-6">
  //           <div className="flex items-center space-x-3">
  //             <Button
  //               category={Category.tertiary}
  //               size={Size.medium}
  //               text="Cancel"
  //             />
  //             <Button
  //               category={Category.primary}
  //               size={Size.medium}
  //               text="Save theme"
  //               type="submit"
  //             />
  //           </div>
  //         </div>
  //       </ModalFooter>
  //     </form>
  //   </ModalContent>
  // </Modal>
  // );
}

export default SaveThemeModal;
