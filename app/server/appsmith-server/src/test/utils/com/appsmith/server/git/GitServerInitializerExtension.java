package com.appsmith.server.git;

import com.appsmith.git.configurations.GitServiceConfig;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.git.common.CommonGitService;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.extension.AfterAllCallback;
import org.junit.jupiter.api.extension.AfterEachCallback;
import org.junit.jupiter.api.extension.BeforeAllCallback;
import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.FileSystemUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * This extension is meant to set up the SSH keys for an artifact and link it to the git server.
 * We'll also set up the repository based on the context,
 * and ensure that all local FS directories for git are clean by the end of a suite
 */
@Component
public class GitServerInitializerExtension implements BeforeAllCallback, BeforeEachCallback, AfterEachCallback, AfterAllCallback {

    @Autowired
    ApplicationService applicationService;

    @Autowired
    GitServiceConfig gitServiceConfig;

    private static GenericContainer<?> gitContainer = new GenericContainer<>(
        CompletableFuture.completedFuture("appsmith/test-event-driver"))
        .withExposedPorts(4200, 22)
        .waitingFor(Wait.forHttp("/").forPort(4200).forStatusCode(200));

    @Override
    public void beforeAll(ExtensionContext extensionContext) {
        gitContainer.start();
        assertThat(gitContainer.isRunning()).isTrue();
    }

    @Override
    public void beforeEach(ExtensionContext extensionContext) {
        ExtensionContext.Store parentContextStore = extensionContext.getParent().get().getStore(ExtensionContext.Namespace.create(ArtifactBuilderExtension.class));
        Class<? extends ArtifactExchangeJson> aClass = parentContextStore.get(ArtifactExchangeJson.class, Class.class);
        String filePath = parentContextStore.get("filePath", String.class);
        ExtensionContext.Store contextStore = extensionContext.getStore(ExtensionContext.Namespace.create(ArtifactBuilderExtension.class));

        String artifactId = contextStore.get(FieldName.ARTIFACT_ID, String.class);
        String repoName = "test" + artifactId;

        // TODO : Move this to artifact service to enable packages
        // Generate RSA public key for the given artifact
        Mono<GitAuth> gitAuthMono = applicationService.createOrUpdateSshKeyPair(artifactId, "RSA");

        String tedGitApiPath = "http://" + gitContainer.getHost() + ":" + gitContainer.getMappedPort(4200) + "/api/v1/git/";

        // Attach public key on TED git server
        Mono<ResponseEntity<Void>> createRepoMono = WebClient.create(tedGitApiPath + "repos")
            .post()
            .bodyValue(Map.of("name", repoName, "private", false))
            .retrieve()
            .toBodilessEntity();

        Mono.zip(gitAuthMono, createRepoMono)
                .flatMap(tuple2 -> {
                    GitAuth auth = tuple2.getT1();
                    String generatedKey = auth.getPublicKey();
                    return WebClient.create(tedGitApiPath + "/keys/" + repoName)
                        .post()
                        .bodyValue(Map.of("title", "key_" + UUID.randomUUID(),
                            "key", generatedKey,
                            "read_only", false))
                        .retrieve()
                        .toBodilessEntity();
                })
            .block();

    }

    @Override
    public void afterEach(ExtensionContext extensionContext) {
        // Delete all repositories created in the current workspace
        ExtensionContext.Store contextStore = extensionContext.getStore(ExtensionContext.Namespace.create(ArtifactBuilderExtension.class));
        String workspaceId = contextStore.get(FieldName.WORKSPACE_ID, String.class);

        Path path = Paths.get(gitServiceConfig.getGitRootPath()).resolve(workspaceId);
        FileSystemUtils.deleteRecursively(path.toFile());
    }

    @Override
    public void afterAll(ExtensionContext extensionContext) {
        // Stop the TED container
        gitContainer.stop();
        assertThat(gitContainer.isRunning()).isFalse();

    }

    public String getGitSshUrl(String repoName) {
        return "ssh://git@" + gitContainer.getHost() +":" + gitContainer.getMappedPort(22) +"/git-server/repos/Cypress/" + repoName + ".git";
    }
}
