package com.appsmith.server.diagnostics;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.constants.Url;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.domains.AIAssistantConfig;
import com.appsmith.server.domains.AIProvider;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.McpConfig;
import com.appsmith.server.domains.McpKey;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.McpKeyRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.OrganizationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.reactive.context.ReactiveWebApplicationContext;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockAuthentication;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.springSecurity;

/**
 * Seeds Mongo with names, Git details, query text, datasource secrets, AI provider credentials and URLs, an MCP key
 * and a user, all containing {@code zzseed}. It collects every section except {@code WORKFLOWS} through the HTTP
 * endpoint as a super user, and checks that no seeded value or seeded ObjectId reaches the response.
 * {@code WORKFLOWS} is left out because this class also runs in EE, where that section needs EE flags; an EE-only
 * test covers it. The test makes the seeded {@code api_user} an instance
 * administrator when it is not one yet, and demotes it afterwards only in that case. It restores the organization
 * configuration it changes.
 */
@SpringBootTest
class SupportDiagnosticsNoSecretsTest {

    static final String SEED = "zzseed";
    static final String SUPER_USER_EMAIL = "api_user";

    @Autowired
    private ReactiveMongoOperations mongoOperations;

    @Autowired
    private ReactiveRedisOperations<String, String> redisOperations;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private McpKeyRepository mcpKeyRepository;

    @Autowired
    private UserUtils userUtils;

    @Autowired
    private OrganizationService organizationService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private SeededDocuments seeds;
    private WebTestClient client;
    private User superUser;
    private boolean promotedSuperUser;
    private SavedConfiguration savedConfiguration;
    private long usersBefore;
    private long mcpKeysBefore;

    @BeforeEach
    void setUp(ReactiveWebApplicationContext context) {
        superUser = userRepository.findByEmail(SUPER_USER_EMAIL).block();
        assertThat(superUser).isNotNull();
        promotedSuperUser =
                !Boolean.TRUE.equals(userUtils.isSuperUser(superUser).block());
        if (promotedSuperUser) {
            userUtils.makeInstanceAdministrator(List.of(superUser)).block();
        }
        client = superUserClient(context, superUser);
        seeds = new SeededDocuments(mongoOperations);
        seedCoreValues(seeds);
        usersBefore = userRepository.countForDiagnostics().block();
        mcpKeysBefore = mcpKeyRepository.countActiveForDiagnostics().block();
        seedUserAndMcpKey(seeds);
        savedConfiguration = SavedConfiguration.capture(organizationService, superUser.getOrganizationId());
        seedOrganizationConfiguration(
                organizationService, superUser.getOrganizationId(), SupportDiagnosticsNoSecretsTest::seedAiAndMcp);
    }

    @AfterEach
    void tearDown() {
        runEveryStep(
                () -> {
                    if (seeds != null) {
                        seeds.removeAll();
                    }
                },
                () -> {
                    try {
                        if (savedConfiguration != null) {
                            savedConfiguration.restore(organizationService);
                        }
                    } finally {
                        savedConfiguration = null;
                    }
                },
                () -> {
                    if (superUser != null) {
                        clearStoredSections(redisOperations, superUser.getOrganizationId());
                    }
                },
                () -> {
                    try {
                        if (promotedSuperUser) {
                            userUtils.removeInstanceAdmin(List.of(superUser)).block();
                        }
                    } finally {
                        promotedSuperUser = false;
                    }
                });
    }

    /** Runs every cleanup step, even after one fails, then rethrows the first failure with the rest suppressed. */
    static void runEveryStep(Runnable... steps) {
        Throwable first = null;
        for (Runnable step : steps) {
            try {
                step.run();
            } catch (RuntimeException | Error e) {
                if (first == null) {
                    first = e;
                } else {
                    first.addSuppressed(e);
                }
            }
        }
        if (first instanceof RuntimeException runtimeException) {
            throw runtimeException;
        }
        if (first instanceof Error error) {
            throw error;
        }
    }

    @ParameterizedTest
    @EnumSource(value = DiagnosticsSectionId.class, mode = EnumSource.Mode.EXCLUDE, names = "WORKFLOWS")
    void should_notExportSeededValues_when_superUserCollectsSection(DiagnosticsSectionId sectionId) throws Exception {
        // Given
        // setUp seeded the values and signed in the super user.

        // When
        String body = collect(client, sectionId);

        // Then
        assertThat(body).doesNotContainIgnoringCase(SEED);
        assertThat(seeds.hexIds()).isNotEmpty();
        for (String seededId : seeds.hexIds()) {
            assertThat(body).doesNotContainIgnoringCase(seededId);
        }
        assertThat(objectMapper.readTree(body).at("/data/status").asText()).isEqualTo("OK");
    }

    @Test
    void should_reportSeededAiAndMcpState_when_superUserCollectsAiMcp() throws Exception {
        // Given
        // setUp seeded a Claude configuration with every provider field filled, MCP on, and one unrevoked MCP key.

        // When
        JsonNode data = objectMapper
                .readTree(collect(client, DiagnosticsSectionId.AI_MCP))
                .at("/data/data");

        // Then
        assertThat(data.at("/aiAssistantEnabled").isBoolean()).isTrue();
        assertThat(data.at("/aiAssistantEnabled").asBoolean()).isTrue();
        assertThat(data.at("/aiAssistantProvider").asText()).isEqualTo(AIProvider.CLAUDE.name());
        assertThat(data.at("/aiAssistantCredentialPresent").isBoolean()).isTrue();
        assertThat(data.at("/aiAssistantCredentialPresent").asBoolean()).isTrue();
        assertThat(data.at("/aiAssistantCustomBaseUrl").isBoolean()).isTrue();
        assertThat(data.at("/aiAssistantCustomBaseUrl").asBoolean()).isTrue();
        assertThat(data.at("/mcpEnabled").isBoolean()).isTrue();
        assertThat(data.at("/mcpEnabled").asBoolean()).isTrue();
        assertThat(data.at("/mcpUnrevokedKeys").isNumber()).isTrue();
        assertThat(data.at("/mcpUnrevokedKeys").asLong() - mcpKeysBefore).isEqualTo(1);
    }

    @Test
    void should_countSeededUser_when_superUserCollectsIdentity() throws Exception {
        // Given
        // setUp seeded one user after counting the users already stored.

        // When
        JsonNode users = objectMapper
                .readTree(collect(client, DiagnosticsSectionId.IDENTITY))
                .at("/data/data/users");

        // Then
        assertThat(users.isNumber()).as("users = " + users).isTrue();
        assertThat(users.asLong() - usersBefore).isEqualTo(1);
    }

    @Test
    void should_countRemotePluginAsOther_when_datasourceUsesIt() throws Exception {
        // Given
        JsonNode before = datasourcesData();
        // The service releases the section lock asynchronously; clearing it keeps the second collect from a 429.
        clearStoredSections(redisOperations, superUser.getOrganizationId());
        seedRemotePluginDatasource(
                seeds, new ObjectId().toHexString(), new ObjectId().toHexString(), new ObjectId().toHexString());

        // When
        JsonNode after = datasourcesData();

        // Then
        assertThat(after.at("/datasourcesByPlugin/other").asLong()
                        - before.at("/datasourcesByPlugin/other").asLong())
                .isEqualTo(1);
        assertThat(after.at("/referencedDatasourcesByPlugin/other").asLong()
                        - before.at("/referencedDatasourcesByPlugin/other").asLong())
                .isEqualTo(1);
    }

    private JsonNode datasourcesData() throws Exception {
        JsonNode data = objectMapper
                .readTree(collect(client, DiagnosticsSectionId.DATASOURCES))
                .at("/data/data");
        assertThat(data.at("/datasourcesByPlugin/other").isNumber()).isTrue();
        assertThat(data.at("/referencedDatasourcesByPlugin/other").isNumber()).isTrue();
        return data;
    }

    /** A client signed in as {@code user}, with a CSRF token. */
    static WebTestClient superUserClient(ReactiveWebApplicationContext context, User user) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(user, "password", user.getAuthorities());
        return WebTestClient.bindToApplicationContext(context)
                .apply(springSecurity())
                .build()
                .mutate()
                // The server stops a section after 10 seconds, which is longer than the 5 second client default.
                .responseTimeout(Duration.ofSeconds(15))
                .build()
                .mutateWith(mockAuthentication(authentication))
                .mutateWith(csrf());
    }

    /** Collects one section and returns the raw response body. */
    static String collect(WebTestClient client, DiagnosticsSectionId sectionId) {
        byte[] body = client.post()
                .uri(Url.SUPPORT_DIAGNOSTICS_URL + "/sections/" + sectionId.name() + "/collect")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .returnResult()
                .getResponseBody();
        assertThat(body).isNotNull();
        return new String(body, StandardCharsets.UTF_8);
    }

    /** Deletes the stored result and the lock of every section for the organization. */
    static void clearStoredSections(ReactiveRedisOperations<String, String> redisOperations, String organizationId) {
        List<String> keys = new ArrayList<>();
        Arrays.stream(DiagnosticsSectionId.values()).forEach(sectionId -> {
            keys.add(DiagnosticsResultStore.resultKey(organizationId, sectionId));
            keys.add(DiagnosticsResultStore.lockKey(organizationId, sectionId));
        });
        redisOperations.delete(keys.toArray(String[]::new)).block();
    }

    /**
     * Seeds a workspace, a Git-connected application, a page, an action with a query body, and a datasource with a
     * password and URL on a remote plugin. Every value a person or a remote system chooses contains {@code zzseed}.
     */
    static void seedCoreValues(SeededDocuments seeds) {
        ObjectId workspaceId = seeds.insert(Workspace.class, new Document("name", "ZZSeed Workspace"));
        ObjectId applicationId = seeds.insert(
                Application.class,
                new Document("name", "zzSeed Application")
                        .append("workspaceId", workspaceId.toHexString())
                        .append(
                                "gitApplicationMetadata",
                                new Document("remoteUrl", "git@github.com:ZZseed-org/zzseed-repo.git")
                                        .append("branchName", "zzSEED-branch")
                                        .append("defaultBranchName", "zzSEED-branch")
                                        .append("repoName", "zzseed-repo")));
        ObjectId pageId = seeds.insert(
                NewPage.class,
                new Document("applicationId", applicationId.toHexString())
                        .append("unpublishedPage", new Document("name", "ZZSEED Page"))
                        .append("publishedPage", new Document("name", "ZZSEED Page")));
        seedRemotePluginDatasource(seeds, workspaceId.toHexString(), applicationId.toHexString(), pageId.toHexString());
    }

    /**
     * Seeds a remote plugin, a datasource on it with a password and URL, and a live action that references the
     * datasource. Each call adds exactly one datasource and one referenced datasource to the {@code other} bucket.
     */
    static void seedRemotePluginDatasource(
            SeededDocuments seeds, String workspaceId, String applicationId, String pageId) {
        ObjectId pluginId = seeds.insert(
                Plugin.class,
                new Document("name", "zzSeed Remote Plugin")
                        .append("type", PluginType.REMOTE.name())
                        .append("packageName", "zzseed-plugin")
                        // pluginName, packageName and version form a unique index; a fresh value avoids a clash.
                        .append("pluginName", "zzseed-plugin-" + new ObjectId().toHexString())
                        .append("version", "1.0"));
        Document datasourceConfiguration = new Document("url", "https://zzSeed-host.example.com/db")
                .append(
                        "authentication",
                        new Document("authenticationType", "dbAuth")
                                .append("username", "zzseed_user")
                                .append("password", "ZZseed-Password-1"));
        ObjectId datasourceId = seeds.insert(
                Datasource.class,
                new Document("name", "zzSeed Datasource")
                        .append("pluginId", pluginId.toHexString())
                        .append("workspaceId", workspaceId)
                        .append("datasourceConfiguration", datasourceConfiguration));
        seeds.insert(
                DatasourceStorage.class,
                new Document("datasourceId", datasourceId.toHexString())
                        .append("environmentId", new ObjectId().toHexString())
                        .append("pluginId", pluginId.toHexString())
                        .append("workspaceId", workspaceId)
                        .append("datasourceConfiguration", datasourceConfiguration));
        Document action = new Document("name", "zzSeedQuery")
                .append("pageId", pageId)
                .append("actionConfiguration", new Document("body", "SELECT 'ZZSEED-secret' FROM zzseed_table"))
                .append(
                        "datasource",
                        new Document("_id", datasourceId.toHexString())
                                .append("name", "zzSeed Datasource")
                                .append("pluginId", pluginId.toHexString()));
        seeds.insert(
                NewAction.class,
                new Document("applicationId", applicationId)
                        .append("workspaceId", workspaceId)
                        .append("pluginId", pluginId.toHexString())
                        .append("pluginType", PluginType.REMOTE.name())
                        .append("unpublishedAction", action)
                        .append("publishedAction", action));
    }

    /**
     * Seeds one user, whose email contains {@code zzseed}, and one unrevoked MCP key of that user, whose name contains
     * {@code zzseed}. Each call adds exactly one user and one unrevoked key to the diagnostics counts.
     */
    static void seedUserAndMcpKey(SeededDocuments seeds) {
        String unique = new ObjectId().toHexString();
        ObjectId userId = seeds.insert(
                User.class,
                new Document("email", "zzseed-user-" + unique + "@example.com")
                        .append("name", "ZZSeed User")
                        .append("isEnabled", true));
        seeds.insert(
                McpKey.class,
                new Document("userId", userId.toHexString())
                        .append("name", "zzSeed MCP Key")
                        .append("keySpanDays", 30));
    }

    /**
     * Selects and enables Claude, fills every key, endpoint, deployment, model and base URL field of every provider,
     * and turns MCP on.
     */
    static void seedAiAndMcp(OrganizationConfiguration configuration) {
        AIAssistantConfig aiConfig = new AIAssistantConfig();
        aiConfig.setAiProvider(AIProvider.CLAUDE);
        aiConfig.setIsAIAssistantEnabled(true);
        aiConfig.setClaudeApiKey("ZZSEED-claude-key");
        aiConfig.setClaudeModel("zzseed-claude-model");
        aiConfig.setClaudeBaseUrl("https://zzseed-claude.example.com");
        aiConfig.setOpenaiApiKey("ZZSEED-openai-key");
        aiConfig.setOpenaiModel("zzseed-openai-model");
        aiConfig.setOpenaiBaseUrl("https://zzseed-openai.example.com");
        aiConfig.setAzureOpenaiApiKey("ZZSEED-azure-key");
        aiConfig.setAzureOpenaiEndpoint("https://zzseed-azure.example.com");
        aiConfig.setAzureOpenaiDeploymentName("zzseed-azure-deployment");
        aiConfig.setAzureOpenaiApiVersion("zzseed-azure-version");
        aiConfig.setCopilotApiKey("ZZSEED-copilot-key");
        aiConfig.setCopilotEndpoint("https://zzseed-copilot.example.com");
        aiConfig.setLocalLlmUrl("https://zzseed-local-llm.example.com");
        aiConfig.setLocalLlmModel("zzseed-local-model");
        configuration.setAiAssistantConfig(aiConfig);

        McpConfig mcpConfig = new McpConfig();
        mcpConfig.setEnabled(true);
        configuration.setMcpConfig(mcpConfig);
    }

    /**
     * Saves the organization configuration changed by {@code seeder}. Capture a {@link SavedConfiguration} first, so
     * tearDown can restore it even when this save fails part way.
     */
    static void seedOrganizationConfiguration(
            OrganizationService organizationService,
            String organizationId,
            Consumer<OrganizationConfiguration> seeder) {
        Organization organization =
                organizationService.retrieveById(organizationId).block();
        OrganizationConfiguration configuration = organization.getOrganizationConfiguration() == null
                ? new OrganizationConfiguration()
                : organization.getOrganizationConfiguration();
        seeder.accept(configuration);
        organization.setOrganizationConfiguration(configuration);
        organizationService.save(organization).block();
    }

    /** The organization configuration as it was before the test changed it. */
    record SavedConfiguration(String organizationId, OrganizationConfiguration configuration) {

        static SavedConfiguration capture(OrganizationService organizationService, String organizationId) {
            return new SavedConfiguration(
                    organizationId,
                    organizationService.retrieveById(organizationId).block().getOrganizationConfiguration());
        }

        void restore(OrganizationService organizationService) {
            Organization organization =
                    organizationService.retrieveById(organizationId).block();
            organization.setOrganizationConfiguration(configuration);
            organizationService.save(organization).block();
        }
    }

    /** Raw documents the test inserts, removed by ID afterwards. */
    static final class SeededDocuments {

        private final ReactiveMongoOperations mongoOperations;
        private final Map<String, List<ObjectId>> idsByCollection = new LinkedHashMap<>();

        SeededDocuments(ReactiveMongoOperations mongoOperations) {
            this.mongoOperations = mongoOperations;
        }

        ObjectId insert(Class<?> domain, Document document) {
            ObjectId id = new ObjectId();
            document.append("_id", id);
            String collection = mongoOperations.getCollectionName(domain);
            mongoOperations.insert(document, collection).block();
            idsByCollection
                    .computeIfAbsent(collection, ignored -> new ArrayList<>())
                    .add(id);
            return id;
        }

        /** The hex string of every seeded ID, such as the workspace, datasource, user and MCP key IDs. */
        List<String> hexIds() {
            return idsByCollection.values().stream()
                    .flatMap(List::stream)
                    .map(ObjectId::toHexString)
                    .toList();
        }

        /** Removes every seeded document. A failed collection does not stop the others and stays tracked. */
        void removeAll() {
            RuntimeException failure = null;
            for (Map.Entry<String, List<ObjectId>> entry : List.copyOf(idsByCollection.entrySet())) {
                try {
                    mongoOperations
                            .remove(Query.query(Criteria.where("_id").in(entry.getValue())), entry.getKey())
                            .block();
                    idsByCollection.remove(entry.getKey());
                } catch (RuntimeException e) {
                    if (failure == null) {
                        failure = e;
                    } else {
                        failure.addSuppressed(e);
                    }
                }
            }
            if (failure != null) {
                throw failure;
            }
        }
    }
}
