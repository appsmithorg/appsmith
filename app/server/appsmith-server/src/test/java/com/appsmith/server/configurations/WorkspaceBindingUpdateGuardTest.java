package com.appsmith.server.configurations;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.EnvironmentPermission;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockAuthentication;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * The workspace an application or a datasource belongs to is fixed when the resource is created. The update
 * endpoints keep that binding regardless of what the request body carries.
 */
@SpringBootTest
class WorkspaceBindingUpdateGuardTest {

    private static final String RESOURCE_OWNER_EMAIL = "usertest@usertest.com";
    private static final String OTHER_WORKSPACE_OWNER_EMAIL = "api_user";

    @Autowired
    private ReactiveWebApplicationContext context;

    @Autowired
    private ApplicationPageService applicationPageService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private DatasourceRepository datasourceRepository;

    @Autowired
    private EnvironmentPermission environmentPermission;

    @Autowired
    private PluginService pluginService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceService workspaceService;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    private RateLimitService rateLimitService;

    private WebTestClient webTestClient;
    private User resourceOwner;
    private User otherWorkspaceOwner;
    private Fixture fixture;

    @BeforeEach
    void setUp() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();
        resourceOwner = userRepository.findByEmail(RESOURCE_OWNER_EMAIL).block();
        otherWorkspaceOwner =
                userRepository.findByEmail(OTHER_WORKSPACE_OWNER_EMAIL).block();
        fixture = createFixture();
    }

    @AfterEach
    void tearDown() {
        runAs(applicationPageService.deleteApplication(fixture.applicationId()), resourceOwner)
                .block();
        runAs(datasourceService.archiveById(fixture.datasourceId()), resourceOwner)
                .block();
        runAs(workspaceService.archiveById(fixture.sourceWorkspaceId()), resourceOwner)
                .block();
        runAs(workspaceService.archiveById(fixture.otherWorkspaceId()), otherWorkspaceOwner)
                .block();
    }

    @Test
    @DisplayName("GHSA-82c9-jmv3-ffg3")
    void should_preserveApplicationWorkspace_when_updateBodyNamesAnotherWorkspace() {
        // Given
        String updatedName = unique("renamed-application");
        Map<String, Object> update = new HashMap<>();
        update.put("name", updatedName);
        update.put("workspaceId", fixture.otherWorkspaceId());

        // When
        authenticatedClient(resourceOwner)
                .put()
                .uri("/api/v1/applications/{id}", fixture.applicationId())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(update)
                .exchange()
                .expectStatus()
                .isOk();

        // Then
        Application afterUpdate =
                applicationRepository.findById(fixture.applicationId()).block();
        Long otherWorkspaceApplicationCount = applicationRepository
                .countByWorkspaceId(fixture.otherWorkspaceId())
                .block();

        assertThat(afterUpdate.getName()).isEqualTo(updatedName);
        assertThat(afterUpdate.getWorkspaceId()).isEqualTo(fixture.sourceWorkspaceId());
        assertThat(otherWorkspaceApplicationCount).isZero();
    }

    @Test
    @DisplayName("GHSA-82c9-jmv3-ffg3")
    void should_preserveDatasourceWorkspace_when_updateBodyNamesAnotherWorkspace() {
        // Given
        String updatedName = unique("renamed-datasource");
        Map<String, Object> update = new HashMap<>();
        update.put("name", updatedName);
        update.put("workspaceId", fixture.otherWorkspaceId());

        // When
        authenticatedClient(resourceOwner)
                .put()
                .uri("/api/v1/datasources/{id}", fixture.datasourceId())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(update)
                .exchange()
                .expectStatus()
                .isOk();

        // Then
        Datasource afterUpdate =
                datasourceRepository.findById(fixture.datasourceId()).block();

        assertThat(afterUpdate.getName()).isEqualTo(updatedName);
        assertThat(afterUpdate.getWorkspaceId()).isEqualTo(fixture.sourceWorkspaceId());
    }

    @Test
    void should_renameApplication_when_updateBodyOmitsWorkspaceId() {
        // Given
        String updatedName = unique("renamed-application");
        Map<String, Object> update = Map.of("name", updatedName);

        // When
        authenticatedClient(resourceOwner)
                .put()
                .uri("/api/v1/applications/{id}", fixture.applicationId())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(update)
                .exchange()
                .expectStatus()
                .isOk();

        // Then
        Application afterUpdate =
                applicationRepository.findById(fixture.applicationId()).block();

        assertThat(afterUpdate.getName()).isEqualTo(updatedName);
        assertThat(afterUpdate.getWorkspaceId()).isEqualTo(fixture.sourceWorkspaceId());
    }

    @Test
    void should_renameDatasource_when_updateBodyOmitsWorkspaceId() {
        // Given
        String updatedName = unique("renamed-datasource");
        Map<String, Object> update = Map.of("name", updatedName);

        // When
        authenticatedClient(resourceOwner)
                .put()
                .uri("/api/v1/datasources/{id}", fixture.datasourceId())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(update)
                .exchange()
                .expectStatus()
                .isOk();

        // Then
        Datasource afterUpdate =
                datasourceRepository.findById(fixture.datasourceId()).block();

        assertThat(afterUpdate.getName()).isEqualTo(updatedName);
        assertThat(afterUpdate.getWorkspaceId()).isEqualTo(fixture.sourceWorkspaceId());
    }

    private Fixture createFixture() {
        Workspace sourceWorkspace = new Workspace();
        sourceWorkspace.setName(unique("source-workspace"));
        Workspace createdSourceWorkspace = workspaceService
                .create(sourceWorkspace, resourceOwner, Boolean.FALSE)
                .block();

        Workspace otherWorkspace = new Workspace();
        otherWorkspace.setName(unique("other-workspace"));
        Workspace createdOtherWorkspace = workspaceService
                .create(otherWorkspace, otherWorkspaceOwner, Boolean.FALSE)
                .block();

        Application application = new Application();
        application.setName(unique("application"));
        Application createdApplication = runAs(
                        applicationPageService.createApplication(application, createdSourceWorkspace.getId()),
                        resourceOwner)
                .block();

        String environmentId = runAs(
                        workspaceService.getDefaultEnvironmentId(
                                createdSourceWorkspace.getId(), environmentPermission.getExecutePermission()),
                        resourceOwner)
                .block();
        Plugin plugin = pluginService.findByPackageName("restapi-plugin").block();
        DatasourceConfiguration configuration = new DatasourceConfiguration();
        configuration.setUrl("https://" + unique("source") + ".example.com");
        DatasourceStorageDTO storage = new DatasourceStorageDTO(null, environmentId, configuration);
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, storage);

        Datasource datasource = new Datasource();
        datasource.setName(unique("datasource"));
        datasource.setWorkspaceId(createdSourceWorkspace.getId());
        datasource.setPluginId(plugin.getId());
        datasource.setDatasourceStorages(storages);
        Datasource createdDatasource =
                runAs(datasourceService.create(datasource), resourceOwner).block();

        return new Fixture(
                createdSourceWorkspace.getId(),
                createdOtherWorkspace.getId(),
                createdApplication.getId(),
                createdDatasource.getId());
    }

    private WebTestClient authenticatedClient(User user) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(user, "password", user.getAuthorities());
        return webTestClient.mutateWith(mockAuthentication(authentication)).mutateWith(csrf());
    }

    private <T> Mono<T> runAs(Mono<T> publisher, User user) {
        return publisher.contextWrite(context -> {
            SecurityContext securityContext = new SecurityContextImpl(
                    new UsernamePasswordAuthenticationToken(user, "password", user.getAuthorities()));
            return context.put(SecurityContext.class, Mono.just(securityContext));
        });
    }

    private String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID();
    }

    private record Fixture(
            String sourceWorkspaceId, String otherWorkspaceId, String applicationId, String datasourceId) {}
}
