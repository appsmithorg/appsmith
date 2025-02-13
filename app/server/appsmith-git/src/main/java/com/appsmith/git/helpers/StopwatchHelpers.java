package com.appsmith.git.helpers;

import com.appsmith.external.helpers.Stopwatch;

import java.nio.file.Path;

public class StopwatchHelpers {
    public static Stopwatch startStopwatch(Path path, String flowName) {
        // path => ..../{workspaceId}/{appId}/{repoName}
        String modifiedFlowName = String.format(
                "JGIT %s, appId %s", flowName, path.getParent().getFileName().toString());
        return new Stopwatch(modifiedFlowName);
    }
}
