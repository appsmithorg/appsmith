import React, { useState } from "react";

import { Checkbox, Button } from "components/wds";
import { ButtonType } from "./Button";

function Showcase() {
  return (
    <div className="container min-h-screen pt-12 mx-auto">
      <h1 className="mt-12 space-y-8 text-3xl font-bold">
        Widgets Design System
      </h1>

      <div className="space-y-5">
        <div className="mt-5">
          <h2 className="my-2 text-xl font-semibold">Checkbox</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-gray-500">States</h3>
              <div className="flex space-x-3">
                <Checkbox checked label="Active" />
                <Checkbox checked={false} disabled label="Disabled" />
                <Checkbox checked={false} hasError label="Error" />
                <Checkbox checked={false} indeterminate label="Indeterminate" />
              </div>
            </div>
          </div>
        </div>

        {/* buttons */}
        <div className="">
          <h2 className="my-2 text-xl font-semibold">Buttons</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-gray-500">States</h3>
              <div className="flex space-x-3">
                <Button
                  buttonColor="red"
                  buttonVariant="PRIMARY"
                  clickWithRecaptcha={() => {
                    //
                  }}
                  isLoading={false}
                  text="Hello"
                  type={ButtonType.BUTTON}
                  widgetId="hello"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Showcase;
