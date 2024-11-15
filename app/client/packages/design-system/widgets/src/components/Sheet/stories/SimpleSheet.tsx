import React, { useState } from "react";
import { Button } from "../../Button";
import { Sheet } from "../index";
import type { SheetProps } from "../src/types";

export const SimpleSheet = (props: Omit<SheetProps, "children">) => {
  const [isOpen, setIsOpen] = useState(props.isOpen);

  return (
    <>
      <Button onPress={() => setIsOpen(!Boolean(isOpen))}>Sheet trigger</Button>
      <Sheet {...props} isOpen={isOpen} onOpenChange={setIsOpen}>
        <div style={{ padding: "1rem" } as React.CSSProperties}>
          <h3>Sheet Content</h3>
          <p>This is an example of sheet content.</p>
        </div>
      </Sheet>
    </>
  );
};
