import type { DefaultRootState } from "react-redux";
import { IDE_TYPE } from "ee/IDE/Interfaces/IDETypes";
import { getAIArtifact } from "./aiAssistantSelectors";

const stateWithApplication = (applicationId?: string) =>
  ({
    entities: { pageList: { applicationId } },
  }) as unknown as DefaultRootState;

describe("getAIArtifact", () => {
  it("returns the current application", () => {
    expect(getAIArtifact(stateWithApplication("app-1"), IDE_TYPE.App)).toEqual({
      artifactId: "app-1",
      artifactType: "APPLICATION",
    });
  });

  it("returns the current application for every IDE type, because CE has Ask AI only in the app editor", () => {
    expect(getAIArtifact(stateWithApplication("app-1"), IDE_TYPE.None)).toEqual(
      { artifactId: "app-1", artifactType: "APPLICATION" },
    );
  });

  it("returns no artifact when there is no current application", () => {
    expect(getAIArtifact(stateWithApplication(), IDE_TYPE.App)).toEqual({});
  });
});
