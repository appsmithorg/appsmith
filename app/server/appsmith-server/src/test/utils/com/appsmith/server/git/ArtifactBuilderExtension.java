package com.appsmith.server.git;

import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ArtifactExchangeJson;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.migrations.JsonSchemaMigration;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.extension.AfterEachCallback;
import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.charset.Charset;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * This extension basically just creates a new workspace and initializes the artifact provided in context
 * This artifact is provided in the form of a JSON file that is specified in the context itself
 */
@Component
public class ArtifactBuilderExtension implements AfterEachCallback, BeforeEachCallback {

    @Autowired
    UserService userService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    ImportService importService;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    JsonSchemaMigration jsonSchemaMigration;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPermission applicationPermission;

    @Autowired
    ApplicationPageService applicationPageService;

    @Override
    public void beforeEach(ExtensionContext extensionContext) throws Exception {
        ExtensionContext.Store parentContextStore = extensionContext.getParent().get().getStore(ExtensionContext.Namespace.create(ArtifactBuilderExtension.class));
        Class<? extends ArtifactExchangeJson> aClass = parentContextStore.get(ArtifactExchangeJson.class, Class.class);
        String filePath = parentContextStore.get("filePath", String.class);
        ExtensionContext.Store contextStore = extensionContext.getStore(ExtensionContext.Namespace.create(ArtifactBuilderExtension.class));

        ArtifactExchangeJson artifactExchangeJson = createArtifactJson(filePath, aClass).block();
        assertThat(artifactExchangeJson).isNotNull();

        artifactExchangeJson.getArtifact().setName(aClass.getSimpleName() + "_" + UUID.randomUUID());

        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("Workspace_" + UUID.randomUUID());
        Workspace workspace =
            workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        assertThat(workspace).isNotNull();

        Artifact artifact = importService.importNewArtifactInWorkspaceFromJson(workspace.getId(), artifactExchangeJson).block();
        assertThat(artifact).isNotNull();

        contextStore.put(FieldName.WORKSPACE_ID, (workspace.getId()));
        contextStore.put(FieldName.ARTIFACT_ID, (artifact.getId()));
    }


    @Override
    public void afterEach(ExtensionContext extensionContext) {

        ExtensionContext.Store contextStore = extensionContext.getStore(ExtensionContext.Namespace.create(ArtifactBuilderExtension.class));
        String workspaceId = contextStore.get(FieldName.WORKSPACE_ID, String.class);

        // Because right now we only have checks for apps
        // Move this to artifact based model when we fix that
        applicationService
            .findByWorkspaceId(workspaceId, applicationPermission.getDeletePermission())
            .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
            .collectList()
            .block();
        workspaceService.archiveById(workspaceId).block();

    }

    private Mono<? extends ArtifactExchangeJson> createArtifactJson(String filePath, Class<? extends ArtifactExchangeJson> exchangeJsonType) throws IOException {

        ClassPathResource classPathResource = new ClassPathResource(filePath);

        String artifactJson = classPathResource.getContentAsString(Charset.defaultCharset());

        ArtifactExchangeJson artifactExchangeJson =
            objectMapper.copy().disable(MapperFeature.USE_ANNOTATIONS).readValue(artifactJson, exchangeJsonType);

        return jsonSchemaMigration.migrateArtifactExchangeJsonToLatestSchema(artifactExchangeJson, null, null);
    }
}
