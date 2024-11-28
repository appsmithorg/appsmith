package com.appsmith.server.git.resourcemap.templates.contexts;

import com.appsmith.server.dtos.ArtifactExchangeJson;
import org.junit.jupiter.api.extension.Extension;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.ParameterContext;
import org.junit.jupiter.api.extension.ParameterResolutionException;
import org.junit.jupiter.api.extension.ParameterResolver;
import org.junit.jupiter.api.extension.TestTemplateInvocationContext;

import java.util.List;

public class ExchangeJsonContext implements TestTemplateInvocationContext, ParameterResolver {

    private final String fileName;

    private final Class<? extends ArtifactExchangeJson> artifactExchangeJsonType;

    private final int resourceMapKeyCount;

    public ExchangeJsonContext(
            String fileName, Class<? extends ArtifactExchangeJson> artifactExchangeJsonType, int resourceMapKeyCount) {
        this.fileName = fileName;
        this.artifactExchangeJsonType = artifactExchangeJsonType;
        this.resourceMapKeyCount = resourceMapKeyCount;
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
        return this;
    }

    public int resourceMapKeyCount() {
        return this.resourceMapKeyCount;
    }
}
