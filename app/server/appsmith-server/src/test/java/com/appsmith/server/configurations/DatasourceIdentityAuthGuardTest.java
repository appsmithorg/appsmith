package com.appsmith.server.configurations;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.DatasourceStorageRepository;
import com.appsmith.server.repositories.UserRepository;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockAuthentication;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

@SpringBootTest
class DatasourceIdentityAuthGuardTest {

    private static final String VICTIM_EMAIL = "api_user";
    private static final String ATTACKER_EMAIL = "usertest@usertest.com";

    @Autowired
    private ReactiveWebApplicationContext context;

    @Autowired
    private DatasourceService datasourceService;

    @Autowired
    private DatasourceRepository datasourceRepository;

    @Autowired
    private DatasourceStorageRepository datasourceStorageRepository;

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

    private final List<Fixture> fixtures = new ArrayList<>();
    private WebTestClient webTestClient;
    private User victim;
    private User attacker;

    @BeforeEach
    void setUp() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        webTestClient = WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build();
        victim = userRepository.findByEmail(VICTIM_EMAIL).block();
        attacker = userRepository.findByEmail(ATTACKER_EMAIL).block();
    }

    @AfterEach
    void tearDown() {
        fixtures.forEach(fixture -> runAs(workspaceService.archiveById(fixture.workspaceId()), fixture.owner())
                .block());
        fixtures.clear();
    }

    @Test
    @DisplayName("GHSA-84wm-8479-xjjm")
    void should_updatePathDatasourceAndPreserveVictim_when_bodyIdTargetsDifferentDatasource() {
        // Given
        Fixture victimFixture = createFixture(victim, "victim");
        Fixture attackerFixture = createFixture(attacker, "attacker");
        String updatedAttackerName = unique("updated-attacker-datasource");

        Datasource update = new Datasource();
        update.setId(victimFixture.datasourceId());
        update.setName(updatedAttackerName);

        // When
        authenticatedClient(attacker)
                .put()
                .uri("/api/v1/datasources/{id}", attackerFixture.datasourceId())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(update)
                .exchange()
                .expectStatus()
                .isOk();

        // Then
        Datasource victimAfterUpdate =
                datasourceRepository.findById(victimFixture.datasourceId()).block();
        Datasource attackerAfterUpdate =
                datasourceRepository.findById(attackerFixture.datasourceId()).block();

        assertThat(victimAfterUpdate.getName()).isEqualTo(victimFixture.datasourceName());
        assertThat(attackerAfterUpdate.getName()).isEqualTo(updatedAttackerName);
    }

    @Test
    @DisplayName("GHSA-84wm-8479-xjjm")
    void should_updateSelectedStorageAndPreserveVictim_when_bodyIdTargetsDifferentStorage() {
        // Given
        Fixture victimFixture = createFixture(victim, "victim");
        Fixture attackerFixture = createFixture(attacker, "attacker");
        String updatedAttackerUrl = "https://" + unique("updated-attacker") + ".example.com";

        DatasourceConfiguration updateConfiguration = new DatasourceConfiguration();
        updateConfiguration.setUrl(updatedAttackerUrl);
        DatasourceStorageDTO update = new DatasourceStorageDTO(
                attackerFixture.datasourceId(), attackerFixture.environmentId(), updateConfiguration);
        update.setId(victimFixture.storageId());

        // When
        authenticatedClient(attacker)
                .put()
                .uri("/api/v1/datasources/datasource-storages")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(update)
                .exchange()
                .expectStatus()
                .isOk();

        // Then
        DatasourceStorage victimAfterUpdate =
                datasourceStorageRepository.findById(victimFixture.storageId()).block();
        DatasourceStorage attackerAfterUpdate = datasourceStorageRepository
                .findById(attackerFixture.storageId())
                .block();

        assertThat(victimAfterUpdate.getDatasourceConfiguration().getUrl()).isEqualTo(victimFixture.datasourceUrl());
        assertThat(attackerAfterUpdate.getDatasourceConfiguration().getUrl()).isEqualTo(updatedAttackerUrl);
    }

    private Fixture createFixture(User owner, String label) {
        Workspace workspace = new Workspace();
        workspace.setName(unique(label + "-workspace"));
        Workspace createdWorkspace =
                workspaceService.create(workspace, owner, Boolean.FALSE).block();
        String environmentId = runAs(
                        workspaceService.getDefaultEnvironmentId(
                                createdWorkspace.getId(), environmentPermission.getExecutePermission()),
                        owner)
                .block();
        Plugin plugin = pluginService.findByPackageName("restapi-plugin").block();
        String datasourceName = unique(label + "-datasource");
        String datasourceUrl = "https://" + unique(label) + ".example.com";

        DatasourceConfiguration configuration = new DatasourceConfiguration();
        configuration.setUrl(datasourceUrl);
        DatasourceStorageDTO storage = new DatasourceStorageDTO(null, environmentId, configuration);
        HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();
        storages.put(environmentId, storage);

        Datasource datasource = new Datasource();
        datasource.setName(datasourceName);
        datasource.setWorkspaceId(createdWorkspace.getId());
        datasource.setPluginId(plugin.getId());
        datasource.setDatasourceStorages(storages);
        Datasource createdDatasource =
                runAs(datasourceService.create(datasource), owner).block();
        DatasourceStorage createdStorage = datasourceStorageRepository
                .findByDatasourceIdAndEnvironmentId(createdDatasource.getId(), environmentId)
                .block();

        Fixture fixture = new Fixture(
                owner,
                createdWorkspace.getId(),
                environmentId,
                createdDatasource.getId(),
                datasourceName,
                createdStorage.getId(),
                datasourceUrl);
        fixtures.add(fixture);
        return fixture;
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
            User owner,
            String workspaceId,
            String environmentId,
            String datasourceId,
            String datasourceName,
            String storageId,
            String datasourceUrl) {}
}
