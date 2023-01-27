import React from "react";
import MenuIcon from "remixicon-react/MenuFillIcon";
import CloseIcon from "remixicon-react/CloseFillIcon";

type MobileNavToggleProps = {
  isMenuOpen: boolean;
  setMenuOpen: (prevState: boolean) => void;
};

const MobileNavToggle = (props: MobileNavToggleProps) => {
  const { isMenuOpen, setMenuOpen } = props;

  return (
    <div
      className="block w-5 h-5 cursor-pointer md:hidden"
      onClick={() => setMenuOpen(!isMenuOpen)}
    >
      {isMenuOpen ? (
        <CloseIcon className="w-5 h-5" />
      ) : (
        <MenuIcon className="w-5 h-5" />
      )}
    </div>
  );
};

export default MobileNavToggle;
