package com.appsmith.server.git.templates.providers.ce;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.git.templates.contexts.GitImportContext;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestTemplateInvocationContext;
import org.junit.jupiter.api.extension.TestTemplateInvocationContextProvider;

import java.util.stream.Stream;

public class GitImportTestTemplateProviderCE implements TestTemplateInvocationContextProvider {

    @Override
    public boolean supportsTestTemplate(ExtensionContext extensionContext) {
        return true;
    }

    @Override
    public Stream<TestTemplateInvocationContext> provideTestTemplateInvocationContexts(
            ExtensionContext extensionContext) {

        // Context for basic import test (empty repository)
        GitImportContext basicContext = new GitImportContext(
                extensionContext,
                "test_assets/ImportExportServiceTest/valid-application.json",
                ApplicationJson.class,
                ArtifactType.APPLICATION);

        // Context for repository with unconfigured datasources
        GitImportContext datasourcesContext = new GitImportContext(
                extensionContext,
                "test_assets/ImportExportServiceTest/valid-application-with-un-configured-datasource.json",
                ApplicationJson.class,
                ArtifactType.APPLICATION);

        // Context for repository with branches (using same as GitBranchesTestTemplateProviderCE)
        GitImportContext branchesContext = new GitImportContext(
                extensionContext,
                "com/appsmith/server/git/application.json",
                ApplicationJson.class,
                ArtifactType.APPLICATION);

        return Stream.of(basicContext, datasourcesContext, branchesContext);
    }
}
