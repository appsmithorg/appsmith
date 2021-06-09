import CodeMirror from "codemirror";
import { getDynamicStringSegments } from "utils/DynamicBindingUtils";
import { HintHelper } from "components/editorComponents/CodeEditor/EditorConfig";
import history from "utils/history";
import { API_EDITOR_URL } from "constants/routes";
import { Completion, NavigableCompletion } from "utils/autocomplete/TernServer";

const ICONS = {
  DB: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 12 12"><path fill="#DEAB41" fill-rule="evenodd" d="M7.9135 0.561055C7.9135 0.870918 6.23457 1.12211 4.1635 1.12211C2.09243 1.12211 0.413498 0.870918 0.413498 0.561055C0.413498 0.251193 2.09243 0 4.1635 0C6.23457 0 7.9135 0.251193 7.9135 0.561055ZM3.03755 3.94381V3.20132H8.24959V1.04044C8.24959 1.04044 7.17068 1.7044 4.1248 1.7044C1.07891 1.7044 0 1.12211 0 1.12211V3.34213C0 3.34213 0.739498 3.62842 1.21327 3.72683C1.73671 3.83556 2.3448 3.90789 3.03755 3.94381ZM3.03618 6.7922C2.42801 6.76073 1.88837 6.70121 1.41063 6.61366C0.850902 6.51107 0 6.19042 0 6.19042V3.9704C0 3.9704 0.897126 4.31392 1.59814 4.41095C2.01645 4.46886 2.49801 4.50902 3.03618 4.53144V6.7922ZM1.41063 9.43546C1.88837 9.52302 2.42801 9.58253 3.03618 9.614V7.35324C2.49801 7.33082 2.01645 7.29066 1.59814 7.23276C0.897126 7.13572 0 6.7922 0 6.7922V9.01222C0 9.01222 0.850902 9.33287 1.41063 9.43546ZM9.71951 3.77119L12 6.01541H9.71951V3.77119ZM9.19505 3.77119H3.75V12H12V6.56804H9.19505V3.77119ZM10.5 7.5H5.25V8.4H10.5V7.5ZM5.25 9.375H9V10.275H5.25V9.375Z" clip-rule="evenodd"/></svg>`,
  API: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 12 12"><path fill="#D6415F" fill-rule="evenodd" d="M12 5.00773L10.6039 4.71741L10.1629 3.65083L10.9443 2.45913L9.54088 1.05571L8.34912 1.83716L7.28278 1.39599L6.99246 0H5.00754L4.71722 1.39599L3.65088 1.83716L2.45912 1.05571L1.0557 2.45913L1.83715 3.65083L1.39606 4.71741L0 5.00773V6.99235L1.39606 7.28267L1.83715 8.34925L1.0557 9.54095L2.45912 10.9444L3.65072 10.1629L4.71722 10.6041L5.00754 12H6.99246L7.28278 10.6041L8.34928 10.1629L9.54088 10.9444L10.9443 9.54095L10.1629 8.34925L10.6039 7.28267L12 6.99235V5.00773ZM2.82293 7.63715L3.0443 6.88257H4.16545L4.37969 7.63715H5.33184L4.17736 4.20227H3.10857L1.95647 7.63715H2.82293ZM4.00121 6.25415H3.21093L3.58702 4.97589H3.63225L4.00121 6.25415ZM6.55648 7.63715V6.63025H7.13491C7.89901 6.63025 8.42507 6.15179 8.42507 5.42102C8.42507 4.68311 7.9252 4.20227 7.18728 4.20227H5.68289V7.63715H6.55648ZM6.95162 5.97089H6.55648V4.87354H6.95639C7.32534 4.87354 7.54196 5.06158 7.54196 5.4234C7.54196 5.78046 7.32296 5.97089 6.95162 5.97089ZM9.71399 7.63715V4.20227H8.84039V7.63715H9.71399Z" clip-rule="evenodd"/></svg>`,
};

export const commandsHelper: HintHelper = () => {
  return {
    showHint: (editor: CodeMirror.Editor, _: string, { actions }) => {
      const cursorBetweenBinding = checkIfCursorInsideBinding(editor);
      const value = editor.getValue();
      const suggestionsHeader = {
        text: "Suggestions",
        displayText: "Suggestions",
        className: "CodeMirror-command-header",
        data: { doc: "" },
        origin: "",
        type: "UNKNOWN",
        isHeader: true,
      };
      const createNewHeader = {
        text: "Create New",
        displayText: "Create New",
        className: "CodeMirror-command-header",
        data: { doc: "" },
        origin: "",
        type: "UNKNOWN",
        isHeader: true,
      };
      const newIntegration = {
        text: "New Integration",
        displayText: "New Integration",
        data: { doc: "" },
        origin: "",
        type: "UNKNOWN",
        className: "CodeMirror-commands",
        isNavLink: true,
      };
      let currentSelection: Completion = {
        origin: "",
        type: "UNKNOWN",
        data: {
          doc: "",
        },
        text: "",
      };
      const slashIndex = value.lastIndexOf("/");
      if (!cursorBetweenBinding && slashIndex > -1) {
        const searchText = value.substring(slashIndex + 1);
        const filteredActions = actions
          .map((action: any) => action.config)
          .filter((action: any) => {
            return (
              action.name &&
              action.name.toLowerCase().startsWith(searchText.toLowerCase())
            );
          })
          .slice(0, 3)
          .map((action: any) => {
            return {
              text: `{{ ${action.name}. }}`,
              displayText: `${action.name}`,
              className: "CodeMirror-commands",
              data: action,
              render: (element: HTMLElement, self: any, data: any) => {
                const pluginType = data.data.pluginType as keyof typeof ICONS;
                element.innerHTML = ICONS[pluginType];
                const span = document.createElement("span");
                span.innerText = data.data.name;
                span.style.marginLeft = "10px";
                element.appendChild(span);
                return element;
              },
            };
          });
        const list = [...filteredActions, createNewHeader, newIntegration];
        if (filteredActions.length) list.unshift(suggestionsHeader);
        const cursor = editor.getCursor();
        const { applicationId, pageId } = fetchAppAndPageId();
        editor.showHint({
          hint: () => {
            const hints = {
              list,
              from: {
                ch: cursor.ch - searchText.length - 1,
                line: cursor.line,
              },
              to: editor.getCursor(),
              selectedHint: 1,
            };
            CodeMirror.on(hints, "pick", (selected: NavigableCompletion) => {
              if (selected.isNavLink) {
                editor.setValue(
                  value.slice(0, value.length - searchText.length - 1),
                );
                history.push(API_EDITOR_URL(applicationId, pageId));
                return;
              } else {
                editor.setValue(
                  value.slice(0, value.length - searchText.length - 1) +
                    selected.text,
                );
                editor.setCursor({
                  line: cursor.line,
                  ch: cursor.ch + selected.text.length - searchText.length - 4,
                });
              }
            });
            CodeMirror.on(hints, "select", (selected: Completion) => {
              currentSelection = selected;
            });
            return hints;
          },
          extraKeys: {
            Up: (cm: CodeMirror.Editor, handle: any) => {
              handle.moveFocus(-1);
              if (currentSelection.isHeader === true) {
                handle.moveFocus(-1);
              }
            },
            Down: (cm: CodeMirror.Editor, handle: any) => {
              handle.moveFocus(1);
              if (currentSelection.isHeader === true) {
                handle.moveFocus(1);
              }
            },
          },
          completeSingle: false,
        });
      }
    },
  };
};

const fetchAppAndPageId = () => {
  const pathSplit = location.pathname.split("/");
  const applicationsIndex = pathSplit.findIndex(
    (path) => path === "applications",
  );
  const pagesIndex = pathSplit.findIndex((path) => path === "pages");
  const applicationId = pathSplit[applicationsIndex + 1];
  const pageId = pathSplit[pagesIndex + 1];
  return { applicationId, pageId };
};

const computeCursorIndex = (editor: CodeMirror.Editor) => {
  const cursor = editor.getCursor();
  let cursorIndex = cursor.ch;
  if (cursor.line > 0) {
    for (let lineIndex = 0; lineIndex < cursor.line; lineIndex++) {
      const line = editor.getLine(lineIndex);
      cursorIndex = cursorIndex + line.length + 1;
    }
  }
  return cursorIndex;
};

const checkIfCursorInsideBinding = (editor: CodeMirror.Editor): boolean => {
  let cursorBetweenBinding = false;
  const value = editor.getValue();
  const cursorIndex = computeCursorIndex(editor);
  const stringSegments = getDynamicStringSegments(value);
  // count of chars processed
  let cumulativeCharCount = 0;
  stringSegments.forEach((segment: string) => {
    const start = cumulativeCharCount;
    const dynamicStart = segment.indexOf("{{");
    const dynamicDoesStart = dynamicStart > -1;
    const dynamicEnd = segment.indexOf("}}");
    const dynamicDoesEnd = dynamicEnd > -1;
    const dynamicStartIndex = dynamicStart + start + 2;
    const dynamicEndIndex = dynamicEnd + start;
    if (
      dynamicDoesStart &&
      cursorIndex >= dynamicStartIndex &&
      ((dynamicDoesEnd && cursorIndex <= dynamicEndIndex) ||
        (!dynamicDoesEnd && cursorIndex >= dynamicStartIndex))
    ) {
      cursorBetweenBinding = true;
    }
    cumulativeCharCount = start + segment.length;
  });
  return cursorBetweenBinding;
};
