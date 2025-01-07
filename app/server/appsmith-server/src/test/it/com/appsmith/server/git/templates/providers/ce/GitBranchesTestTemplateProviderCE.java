package com.appsmith.server.git.templates.providers.ce;

import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.git.templates.contexts.AutoCommitExpectations;
import com.appsmith.server.git.templates.contexts.GitContext;
import com.appsmith.server.git.autocommit.AutoCommitEventHandlerCEImpl;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.TestTemplateInvocationContext;
import org.junit.jupiter.api.extension.TestTemplateInvocationContextProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

public class GitBranchesTestTemplateProviderCE implements TestTemplateInvocationContextProvider {

    @Override
    public boolean supportsTestTemplate(ExtensionContext extensionContext) {
        return true;
    }

    @Autowired
    private Environment env;

    @Override
    public Stream<TestTemplateInvocationContext> provideTestTemplateInvocationContexts(
            ExtensionContext extensionContext) {
        // Create auto-commit expectations based on real application configuration
        AutoCommitExpectations autoCommitExpectations = AutoCommitExpectations.builder()
            .enabled(true)
            .expectedCommitMessagePattern(String.format(
                AutoCommitEventHandlerCEImpl.AUTO_COMMIT_MSG_FORMAT,
                env.getProperty("appsmith.version", "UNKNOWN")))
            .shouldTriggerAutoCommit(true)
            .build();

        GitContext context = new GitContext(
            extensionContext,
            "com/appsmith/server/git/application.json",
            ApplicationJson.class,
            ArtifactType.APPLICATION,
            autoCommitExpectations);
        return Stream.of(context);
    }
}
