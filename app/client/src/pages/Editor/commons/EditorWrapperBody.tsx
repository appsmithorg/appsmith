import React from "react";

interface EditorWrapperBodyProps {
  children: React.ReactNode;
  id: string;
}

function EditorWrapperBody({ children, id }: EditorWrapperBodyProps) {
  return (
    <div className="relative flex flex-col w-full overflow-auto" id={id}>
      {children}
    </div>
  );
}

export default EditorWrapperBody;
