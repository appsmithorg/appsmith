import CodeMirror from "codemirror";
import { isMac } from "utils/helpers";

export const getCodeCommentKeyMap = () => {
  return isMac() ? "Cmd-/" : "Ctrl-/";
};

export const handleCodeComment = (cm: CodeMirror.Editor) => {
  cm.toggleComment({
    commentBlankLines: true,
  });
};
