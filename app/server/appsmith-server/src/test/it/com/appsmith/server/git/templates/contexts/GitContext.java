package com.appsmith.server.git.templates.contexts;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.git.ArtifactBuilderExtension;
import org.junit.jupiter.api.extension.Extension;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.ParameterContext;
import org.junit.jupiter.api.extension.ParameterResolutionException;
import org.junit.jupiter.api.extension.ParameterResolver;
import org.junit.jupiter.api.extension.TestTemplateInvocationContext;

import java.util.List;

public class GitContext implements TestTemplateInvocationContext, ParameterResolver {

    private final String fileName;
    private final Class<? extends ArtifactExchangeJson> artifactExchangeJsonType;
    private final ArtifactType artifactType;
    private final AutoCommitExpectations autoCommitExpectations;

    public GitContext(
        ExtensionContext extensionContext, String fileName, Class<? extends ArtifactExchangeJson> artifactExchangeJsonType, ArtifactType artifactType) {
        this(extensionContext, fileName, artifactExchangeJsonType, artifactType, null);
    }

    public GitContext(
        ExtensionContext extensionContext, String fileName, Class<? extends ArtifactExchangeJson> artifactExchangeJsonType, ArtifactType artifactType,
        AutoCommitExpectations autoCommitExpectations) {
        this.artifactType = artifactType;
        ExtensionContext.Store contextStore = extensionContext.getStore(ExtensionContext.Namespace.create(ArtifactBuilderExtension.class));
        contextStore.put(ArtifactExchangeJson.class, artifactExchangeJsonType);
        contextStore.put("filePath", fileName);
        contextStore.put("artifactType", artifactType);
        this.fileName = fileName;
        this.artifactExchangeJsonType = artifactExchangeJsonType;
        this.autoCommitExpectations = autoCommitExpectations;
    }

    @Override
    public String getDisplayName(int invocationIndex) {
        return fileName;
    }

    @Override
    public List<Extension> getAdditionalExtensions() {
        return List.of(this);
    }

    public String getFileName() {
        return fileName;
    }

    public Class<? extends ArtifactExchangeJson> getArtifactExchangeJsonType() {
        return artifactExchangeJsonType;
    }

    @Override
    public boolean supportsParameter(ParameterContext parameterContext, ExtensionContext extensionContext)
        throws ParameterResolutionException {
        return true;
    }

    @Override
    public Object resolveParameter(ParameterContext parameterContext, ExtensionContext extensionContext)
        throws ParameterResolutionException {
        if (parameterContext.getParameter().getType().equals(ExtensionContext.class)) {
            return extensionContext;
        }

        return this;
    }

    public ArtifactType getArtifactType() {
        return artifactType;
    }

    public AutoCommitExpectations getAutoCommitExpectations() {
        return autoCommitExpectations;
    }
}
