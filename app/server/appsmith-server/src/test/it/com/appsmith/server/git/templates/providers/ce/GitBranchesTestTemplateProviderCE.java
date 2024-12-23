package com.appsmith.server.git.templates.providers.ce;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.git.templates.contexts.GitContext;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestTemplateInvocationContext;
import org.junit.jupiter.api.extension.TestTemplateInvocationContextProvider;

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

public class GitBranchesTestTemplateProviderCE implements TestTemplateInvocationContextProvider {

    @Override
    public boolean supportsTestTemplate(ExtensionContext extensionContext) {
        return true;
    }

    @Override
    public Stream<TestTemplateInvocationContext> provideTestTemplateInvocationContexts(
            ExtensionContext extensionContext) {
        GitContext context = new GitContext(
            extensionContext,
            "com/appsmith/server/git/application.json",
            ApplicationJson.class,
            ArtifactType.APPLICATION);
        return Stream.of(context);
    }
}
