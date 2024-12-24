package com.appsmith.server.git.templates.providers;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.git.templates.contexts.GitImportContext;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestTemplateInvocationContext;
import org.junit.jupiter.api.extension.TestTemplateInvocationContextProvider;
import org.springframework.stereotype.Component;

import java.util.stream.Stream;

@Component
public class GitImportTestTemplateProvider implements TestTemplateInvocationContextProvider {
    
    @Override
    public boolean supportsTestTemplate(ExtensionContext extensionContext) {
        return true;
    }

    @Override
    public Stream<TestTemplateInvocationContext> provideTestTemplateInvocationContexts(
            ExtensionContext extensionContext) {

        GitImportContext context = new GitImportContext(
                extensionContext,
                "test_assets/ImportExportServiceTest/valid-application.json",
                ApplicationJson.class,
                ArtifactType.APPLICATION);

        return Stream.of(context);
    }
}
