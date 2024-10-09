import { useEditorType, EditorNames } from "./index";
import {
  BUILDER_VIEWER_PATH_PREFIX,
  BUILDER_BASE_PATH_DEPRECATED,
} from "constants/routes";

describe("useEditorType", () => {
  it('should return "app" for BUILDER_VIEWER_PATH_PREFIX', () => {
    const result = useEditorType(BUILDER_VIEWER_PATH_PREFIX);

    expect(result).toBe(EditorNames.APPLICATION);
  });

  it('should return "app" for BUILDER_BASE_PATH_DEPRECATED', () => {
    const result = useEditorType(BUILDER_BASE_PATH_DEPRECATED);

    expect(result).toBe(EditorNames.APPLICATION);
  });

  it('should default to "app" for unmatched paths', () => {
    const result = useEditorType("/some-random-path");

    expect(result).toBe(EditorNames.APPLICATION);
  });
});
