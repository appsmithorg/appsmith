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
    
    @Autowired
    private GitFileSystemTestHelper gitFileSystemTestHelper;

    @Override
    public Stream<TestTemplateInvocationContext> provideTestTemplateInvocationContexts(
            ExtensionContext extensionContext) {
        // Load and analyze application.json to determine auto-commit expectations
        ApplicationJson applicationJson = gitFileSystemTestHelper.getApplicationJson(
            GitBranchesTestTemplateProviderCE.class.getResource("/com/appsmith/server/git/application.json"));

        // Determine if auto-commit should trigger based on application state
        // Auto-commit is triggered when there are pages or actions that could be modified
        boolean shouldTriggerAutoCommit = applicationJson != null && 
            (applicationJson.getPageList() != null || applicationJson.getActionList() != null);

        // Create expectations based on actual application configuration
        AutoCommitExpectations autoCommitExpectations = AutoCommitExpectations.builder()
            .enabled(true) // Auto-commit is enabled by default in test environment
            .expectedCommitMessagePattern(String.format(
                AutoCommitEventHandlerCEImpl.AUTO_COMMIT_MSG_FORMAT,
                env.getProperty("appsmith.version", "UNKNOWN"))) // Version from environment
            .shouldTriggerAutoCommit(shouldTriggerAutoCommit) // Based on application.json content
            .expectedCommitAuthor("Appsmith Auto-commit") // System commits should use a consistent author
            .expectedTimestampPattern("\\d+") // Unix timestamp format
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
