import React from "react";
import { IoProvider } from "socket.io-react-hook";
import SocketLayers from "./socketLayers";

type SocketWrapperType = {
  children: any;
};

const SocketWrapper = ({ children }: SocketWrapperType) => {
  return (
    <IoProvider>
      {children}
      <SocketLayers />
    </IoProvider>
  );
};

export default SocketWrapper;
