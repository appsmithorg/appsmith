import React, { useState } from "react";

import Checkbox from "components/ads/Checkbox";
import Dialog from "components/ads/DialogComponent";
import CloseIcon from "remixicon-react/CloseLineIcon";
import Button, { Category, Size } from "components/ads/Button";
import TextInput, { notEmptyValidator } from "components/ads/TextInput";

interface SaveThemeModalProps {
  isOpen: boolean;
  onClose(): void;
}

function SaveThemeModal(props: SaveThemeModalProps) {
  const { isOpen, onClose } = props;
  const [name, setName] = useState("");

  return (
    <Dialog canOutsideClickClose isOpen={isOpen} onClose={onClose}>
      <form data-cy="save-theme-form">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Save Theme</h2>
          <button onClick={onClose} type="button">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="py-6 pb-8 space-y-3 border-b">
          <p>
            You can save your custom themes to use across applications and use
            them when you need.
          </p>
          <div className="mt-6 space-y-2">
            <h3 className="text-gray-700">Your theme name</h3>
            <TextInput
              autoFocus
              fill
              name="name"
              onChange={setName}
              placeholder="My theme"
              validator={notEmptyValidator}
            />
          </div>
        </div>
        <div className="py-6">
          <p className="text-base">Want to share your customised theme?</p>
          <p className="mt-2 text-gray-600">
            You can submit your theme to Appsmith to be included in our as part
            of our prefined themes.
          </p>
          <div className="mt-3">
            <Checkbox label="Submit this theme to Appsmith" />
          </div>
        </div>

        <div className="">
          <div className="flex items-center space-x-3">
            <Button
              category={Category.tertiary}
              size={Size.medium}
              text="Cancel"
            />
            <Button
              category={Category.primary}
              disabled={!name}
              size={Size.medium}
              text="Save theme"
              type="submit"
            />
          </div>
        </div>
      </form>
    </Dialog>
  );
}

export default SaveThemeModal;
