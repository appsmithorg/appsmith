package com.appsmith.server.git.templates.contexts;

import com.appsmith.server.constants.ArtifactType;
import org.junit.jupiter.api.extension.ExtensionContext;

public class GitImportContext extends GitContext {
    public GitImportContext(ExtensionContext extensionContext,
                          String jsonFilePath,
                          Class<?> jsonClass,
                          ArtifactType artifactType) {
        super(extensionContext, jsonFilePath, jsonClass, artifactType);
    }
}
