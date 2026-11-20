package com.appsmith.server.diagnostics.collectors;

import com.appsmith.external.services.RTSCaller;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.diagnostics.DiagnosticsRedactionGuard;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.domains.AIAssistantConfig;
import com.appsmith.server.domains.AIProvider;
import com.appsmith.server.domains.McpConfig;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.McpKeyRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.ce.AIConfigServiceCE;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.lang.reflect.Constructor;
import java.net.ServerSocket;
import java.time.Duration;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.TreeSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiMcpDiagnosticsCollectorTest {

    private static final String SEED = "zzseed";

    @Mock
    private OrganizationService organizationService;

    @Mock
    private DatasourceRepository datasourceRepository;

    @Mock
    private PluginRepository pluginRepository;

    @Mock
    private McpKeyRepository mcpKeyRepository;

    @Mock
    private DiagnosticsLoopbackProbe loopbackProbe;

    @Mock
    private CommonConfig commonConfig;

    private final OrganizationConfiguration configuration = new OrganizationConfiguration();

    private final Organization organization = new Organization();

    private final DiagnosticsRedactionGuard guard = new DiagnosticsRedactionGuard(new ObjectMapper());

    @BeforeEach
    void setUp() {
        organization.setId("org-1");
        organization.setOrganizationConfiguration(configuration);
        lenient().when(organizationService.retrieveById("org-1")).thenReturn(Mono.fromSupplier(() -> organization));
        lenient().when(datasourceRepository.countByPluginIdForDiagnostics()).thenReturn(Mono.just(Map.of()));
        lenient().when(mcpKeyRepository.countActiveForDiagnostics()).thenReturn(Mono.just(2L));
        lenient().when(loopbackProbe.mcp()).thenReturn(Mono.just(DiagnosticsValues.UP));
        lenient().when(commonConfig.getMcpInternalSecret()).thenReturn(SEED + "-mcp-internal-secret");
    }

    private AiMcpDiagnosticsCollectorCE collector() {
        return collector(loopbackProbe);
    }

    private AiMcpDiagnosticsCollectorCE collector(DiagnosticsLoopbackProbe probe) {
        return new AiMcpDiagnosticsCollectorCE(
                organizationService, datasourceRepository, pluginRepository, mcpKeyRepository, probe, commonConfig);
    }

    private Map<String, Object> collected(AiMcpDiagnosticsCollectorCE collector) {
        Map<String, Object> data = new LinkedHashMap<>();
        StepVerifier.create(collector.collect("org-1"))
                .consumeNextWith(data::putAll)
                .verifyComplete();
        return data;
    }

    /** Collects on virtual time and returns the data emitted once {@link DiagnosticsValues#EE_READ_TIMEOUT} passes. */
    private Map<String, Object> collectedAfterReadTimeout(AiMcpDiagnosticsCollectorCE collector) {
        Map<String, Object> data = new LinkedHashMap<>();
        StepVerifier.withVirtualTime(() -> collector.collect("org-1"))
                .expectSubscription()
                .thenAwait(DiagnosticsValues.EE_READ_TIMEOUT)
                .consumeNextWith(data::putAll)
                .expectComplete()
                .verify(Duration.ofSeconds(5));
        return data;
    }

    private AIAssistantConfig givenAiConfig(AIProvider provider) {
        AIAssistantConfig aiConfig = new AIAssistantConfig();
        aiConfig.setAiProvider(provider);
        aiConfig.setIsAIAssistantEnabled(true);
        configuration.setAiAssistantConfig(aiConfig);
        return aiConfig;
    }

    /** Sets every secret, endpoint, deployment, model and base URL to a value that contains {@link #SEED}. */
    private static void seedEverySensitiveField(AIAssistantConfig aiConfig) {
        aiConfig.setClaudeApiKey(SEED + "-claude-key");
        aiConfig.setClaudeModel(SEED + "-claude-model");
        aiConfig.setClaudeBaseUrl("https://" + SEED + "-claude.example.com");
        aiConfig.setOpenaiApiKey(SEED + "-openai-key");
        aiConfig.setOpenaiModel(SEED + "-openai-model");
        aiConfig.setOpenaiBaseUrl("https://" + SEED + "-openai.example.com");
        aiConfig.setCopilotApiKey(SEED + "-copilot-key");
        aiConfig.setCopilotEndpoint("https://" + SEED + "-copilot.example.com");
        aiConfig.setAzureOpenaiApiKey(SEED + "-azure-key");
        aiConfig.setAzureOpenaiEndpoint("https://" + SEED + "-azure.example.com");
        aiConfig.setAzureOpenaiDeploymentName(SEED + "-azure-deployment");
        aiConfig.setAzureOpenaiApiVersion(SEED + "-azure-version");
        aiConfig.setLocalLlmUrl("http://" + SEED + "-local-llm:11434");
        aiConfig.setLocalLlmModel(SEED + "-local-model");
    }

    private static Plugin plugin(String id, String packageName) {
        Plugin plugin = new Plugin();
        plugin.setId(id);
        plugin.setPackageName(packageName);
        return plugin;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> aiDatasources(Map<String, Object> data) {
        return (Map<String, Object>) data.get("aiDatasourcesByPlugin");
    }

    @ParameterizedTest
    @EnumSource(AIProvider.class)
    void should_omitSecretsAndEndpoints_when_eachProviderConfigured(AIProvider provider) {
        // Given
        seedEverySensitiveField(givenAiConfig(provider));
        AiMcpDiagnosticsCollectorCE collector = collector();

        // When
        Map<String, Object> data = collected(collector);

        // Then
        assertThat(data)
                .containsEntry("aiAssistantEnabled", true)
                .containsEntry("aiAssistantCredentialPresent", true)
                .containsEntry("mcpInternalSecretConfigured", true);
        assertThat(data.toString()).doesNotContainIgnoringCase(SEED);
        assertThat(guard.violation(collector.schema(), data)).isEmpty();
    }

    @Test
    void should_reportCredentialPresent_when_localLlmUrlOnly() {
        // Given
        givenAiConfig(AIProvider.LOCAL_LLM).setLocalLlmUrl("http://localhost:11434");

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data)
                .containsEntry("aiAssistantProvider", "LOCAL_LLM")
                .containsEntry("aiAssistantCredentialPresent", true);
    }

    @ParameterizedTest
    @EnumSource(
            value = AIProvider.class,
            names = {"AZURE_OPENAI", "COPILOT"})
    void should_reportCredentialPresent_when_azureCopilotKeyOnly(AIProvider provider) {
        // Given
        givenAiConfig(provider).setCopilotApiKey("copilot-key");

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data).containsEntry("aiAssistantCredentialPresent", true);
    }

    @Test
    void should_reportCredentialAbsent_when_azureHasNeitherKey() {
        // Given
        AIAssistantConfig aiConfig = givenAiConfig(AIProvider.AZURE_OPENAI);
        aiConfig.setAzureOpenaiEndpoint("https://azure.example.com");
        aiConfig.setClaudeApiKey("claude-key");
        aiConfig.setOpenaiApiKey("openai-key");

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data).containsEntry("aiAssistantCredentialPresent", false);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t"})
    void should_reportCredentialAbsent_when_keyBlank(String key) {
        // Given
        AIAssistantConfig aiConfig = givenAiConfig(AIProvider.CLAUDE);
        aiConfig.setClaudeApiKey(key);
        aiConfig.setOpenaiApiKey("openai-key");

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data).containsEntry("aiAssistantCredentialPresent", false);
    }

    @Test
    void should_reportUnknownDependentKeys_when_providerNull() {
        // Given
        AIAssistantConfig aiConfig = givenAiConfig(null);
        seedEverySensitiveField(aiConfig);

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data)
                .containsEntry("aiAssistantProvider", DiagnosticsValues.UNKNOWN)
                .containsEntry("aiAssistantCredentialPresent", DiagnosticsValues.UNKNOWN)
                .containsEntry("aiAssistantCustomBaseUrl", DiagnosticsValues.UNKNOWN);
    }

    @Test
    void should_reportNotApplicableBaseUrl_when_providerLocalLlm() {
        // Given
        AIAssistantConfig aiConfig = givenAiConfig(AIProvider.LOCAL_LLM);
        aiConfig.setClaudeBaseUrl("https://claude.example.com");
        aiConfig.setOpenaiBaseUrl("https://openai.example.com");

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data).containsEntry("aiAssistantCustomBaseUrl", DiagnosticsValues.NOT_APPLICABLE);
    }

    @ParameterizedTest
    @EnumSource(
            value = AIProvider.class,
            names = {"CLAUDE", "OPENAI"})
    void should_reportCustomBaseUrl_when_providerUsesOne(AIProvider provider) {
        // Given
        AIAssistantConfig aiConfig = givenAiConfig(provider);
        if (provider == AIProvider.CLAUDE) {
            aiConfig.setClaudeBaseUrl("https://claude.example.com");
        } else {
            aiConfig.setOpenaiBaseUrl("https://openai.example.com");
        }

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data)
                .containsEntry("aiAssistantProvider", provider.name())
                .containsEntry("aiAssistantCustomBaseUrl", true);
    }

    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {
                "CLAUDE | https://api.anthropic.com",
                "CLAUDE | https://api.anthropic.com/",
                "CLAUDE | ' HTTPS://API.ANTHROPIC.COM '",
                "OPENAI | https://api.openai.com",
                "OPENAI | https://api.openai.com//",
                "OPENAI | ' https://API.openai.com '"
            })
    void should_reportNoCustomBaseUrl_when_providerDefaultStored(AIProvider provider, String baseUrl) {
        // Given
        AIAssistantConfig aiConfig = givenAiConfig(provider);
        if (provider == AIProvider.CLAUDE) {
            aiConfig.setClaudeBaseUrl(baseUrl);
        } else {
            aiConfig.setOpenaiBaseUrl(baseUrl);
        }

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data)
                .containsEntry("aiAssistantProvider", provider.name())
                .containsEntry("aiAssistantCustomBaseUrl", false);
    }

    @Test
    void should_normalizeCopilot_when_providerCopilot() {
        // Given
        givenAiConfig(AIProvider.COPILOT).setAzureOpenaiApiKey("azure-key");

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data)
                .containsEntry("aiAssistantProvider", "AZURE_OPENAI")
                .containsEntry("aiAssistantCredentialPresent", true)
                .containsEntry("aiAssistantCustomBaseUrl", DiagnosticsValues.NOT_APPLICABLE);
    }

    @Test
    void should_reportFalse_when_aiConfigNull() {
        // Given
        configuration.setAiAssistantConfig(null);

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data)
                .containsEntry("aiAssistantEnabled", false)
                .containsEntry("aiAssistantProvider", DiagnosticsValues.UNKNOWN)
                .containsEntry("aiAssistantCredentialPresent", DiagnosticsValues.UNKNOWN)
                .containsEntry("aiAssistantCustomBaseUrl", DiagnosticsValues.UNKNOWN);
    }

    @Test
    void should_reportFalse_when_mcpConfigNull() {
        // Given
        configuration.setMcpConfig(null);

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data).containsEntry("mcpEnabled", false);
    }

    @Test
    void should_reportMcpEnabled_when_mcpConfigEnabled() {
        // Given
        McpConfig mcpConfig = new McpConfig();
        mcpConfig.setEnabled(true);
        configuration.setMcpConfig(mcpConfig);

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data).containsEntry("mcpEnabled", true).containsEntry("mcpUnrevokedKeys", 2L);
    }

    @Test
    void should_reportUnknown_when_organizationConfigurationNull() {
        // Given
        organization.setOrganizationConfiguration(null);
        AiMcpDiagnosticsCollectorCE collector = collector();

        // When
        Map<String, Object> data = collected(collector);

        // Then
        assertThat(data)
                .containsEntry("aiAssistantEnabled", DiagnosticsValues.UNKNOWN)
                .containsEntry("aiAssistantProvider", DiagnosticsValues.UNKNOWN)
                .containsEntry("aiAssistantCredentialPresent", DiagnosticsValues.UNKNOWN)
                .containsEntry("aiAssistantCustomBaseUrl", DiagnosticsValues.UNKNOWN)
                .containsEntry("mcpEnabled", DiagnosticsValues.UNKNOWN);
        assertThat(guard.violation(collector.schema(), data)).isEmpty();
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void should_reportSecretAbsent_when_mcpInternalSecretBlank(String secret) {
        // Given
        when(commonConfig.getMcpInternalSecret()).thenReturn(secret);

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data).containsEntry("mcpInternalSecretConfigured", false);
    }

    @Test
    void should_reportZeroForEveryAiPlugin_when_noneConfigured() {
        // Given
        when(datasourceRepository.countByPluginIdForDiagnostics()).thenReturn(Mono.just(Map.of("p-pg", 5L)));
        when(pluginRepository.findAllByIdsWithoutPermission(any(), any()))
                .thenReturn(Flux.just(plugin("p-pg", "postgres-plugin")));

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(aiDatasources(data).keySet())
                .containsExactlyElementsOf(new TreeSet<>(DiagnosticsPluginBuckets.AI_PACKAGE_NAMES));
        assertThat(aiDatasources(data).values()).containsOnly(0L);
    }

    @Test
    void should_countAiDatasources_when_aiPluginsConfigured() {
        // Given
        when(datasourceRepository.countByPluginIdForDiagnostics())
                .thenReturn(Mono.just(Map.of("p-openai", 2L, "p-anthropic", 1L, "p-pg", 5L, "p-remote", 4L)));
        when(pluginRepository.findAllByIdsWithoutPermission(any(), any()))
                .thenReturn(Flux.just(
                        plugin("p-openai", "openai-plugin"),
                        plugin("p-anthropic", "anthropic-plugin"),
                        plugin("p-pg", "postgres-plugin"),
                        plugin("p-remote", SEED + "-remote-plugin")));

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(aiDatasources(data))
                .containsEntry("openai-plugin", 2L)
                .containsEntry("anthropic-plugin", 1L)
                .containsEntry("googleai-plugin", 0L)
                .hasSize(DiagnosticsPluginBuckets.AI_PACKAGE_NAMES.size());
        assertThat(data.toString()).doesNotContainIgnoringCase(SEED);
    }

    @Test
    void should_reportProcessDown_when_mcpUnreachable(@Mock RTSCaller rtsCaller) throws IOException {
        // Given
        int closedPort;
        try (ServerSocket socket = new ServerSocket(0)) {
            closedPort = socket.getLocalPort();
        }
        DiagnosticsLoopbackProbe probe =
                DiagnosticsLoopbackProbe.withMcpBaseUrl(rtsCaller, "http://127.0.0.1:" + closedPort);

        // When
        Map<String, Object> data = collected(collector(probe));

        // Then
        assertThat(data).containsEntry("mcpProcess", DiagnosticsValues.DOWN);
    }

    @Test
    void should_reportUnrevokedKeysUnknown_when_mcpKeyCountHangs() {
        // Given
        when(mcpKeyRepository.countActiveForDiagnostics()).thenReturn(Mono.never());
        when(datasourceRepository.countByPluginIdForDiagnostics()).thenReturn(Mono.just(Map.of("p-openai", 3L)));
        when(pluginRepository.findAllByIdsWithoutPermission(any(), any()))
                .thenReturn(Flux.just(plugin("p-openai", "openai-plugin")));
        McpConfig mcpConfig = new McpConfig();
        mcpConfig.setEnabled(true);
        configuration.setMcpConfig(mcpConfig);

        // When
        Map<String, Object> data = collectedAfterReadTimeout(collector());

        // Then
        assertThat(data)
                .containsEntry("mcpUnrevokedKeys", DiagnosticsValues.UNKNOWN)
                .containsEntry("mcpEnabled", true)
                .containsEntry("mcpInternalSecretConfigured", true)
                .containsEntry("mcpProcess", DiagnosticsValues.UP)
                .containsEntry("aiAssistantEnabled", false);
        assertThat(aiDatasources(data)).containsEntry("openai-plugin", 3L);
    }

    @Test
    void should_reportAiDatasourcesUnknown_when_datasourceCountHangs() {
        // Given
        when(datasourceRepository.countByPluginIdForDiagnostics()).thenReturn(Mono.never());
        AiMcpDiagnosticsCollectorCE collector = collector();

        // When
        Map<String, Object> data = collectedAfterReadTimeout(collector);

        // Then
        assertThat(aiDatasources(data).keySet())
                .containsExactlyElementsOf(new TreeSet<>(DiagnosticsPluginBuckets.AI_PACKAGE_NAMES));
        assertThat(aiDatasources(data).values()).containsOnly(DiagnosticsValues.UNKNOWN);
        assertThat(data).containsEntry("mcpUnrevokedKeys", 2L).containsEntry("mcpEnabled", false);
        assertThat(guard.violation(collector.schema(), data)).isEmpty();
    }

    @Test
    void should_reportOrganizationKeysUnknown_when_organizationReadHangs() {
        // Given
        when(organizationService.retrieveById("org-1")).thenReturn(Mono.never());

        // When
        Map<String, Object> data = collectedAfterReadTimeout(collector());

        // Then
        assertThat(data)
                .containsEntry("aiAssistantEnabled", DiagnosticsValues.UNKNOWN)
                .containsEntry("aiAssistantProvider", DiagnosticsValues.UNKNOWN)
                .containsEntry("aiAssistantCredentialPresent", DiagnosticsValues.UNKNOWN)
                .containsEntry("aiAssistantCustomBaseUrl", DiagnosticsValues.UNKNOWN)
                .containsEntry("mcpEnabled", DiagnosticsValues.UNKNOWN)
                .containsEntry("mcpUnrevokedKeys", 2L)
                .containsEntry("mcpProcess", DiagnosticsValues.UP);
    }

    @Test
    void should_reportOrganizationKeysUnknown_when_organizationReadFails() {
        // Given
        when(organizationService.retrieveById("org-1"))
                .thenReturn(Mono.error(new IllegalStateException(SEED + "-decode-error")));

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data)
                .containsEntry("aiAssistantEnabled", DiagnosticsValues.UNKNOWN)
                .containsEntry("aiAssistantProvider", DiagnosticsValues.UNKNOWN)
                .containsEntry("aiAssistantCredentialPresent", DiagnosticsValues.UNKNOWN)
                .containsEntry("aiAssistantCustomBaseUrl", DiagnosticsValues.UNKNOWN)
                .containsEntry("mcpEnabled", DiagnosticsValues.UNKNOWN)
                .containsEntry("mcpInternalSecretConfigured", true)
                .containsEntry("mcpUnrevokedKeys", 2L)
                .containsEntry("mcpProcess", DiagnosticsValues.UP);
        assertThat(aiDatasources(data).values()).containsOnly(0L);
        assertThat(data.toString()).doesNotContainIgnoringCase(SEED);
    }

    @Test
    void should_reportUnrevokedKeysUnknown_when_mcpKeyCountEmpty() {
        // Given
        when(mcpKeyRepository.countActiveForDiagnostics()).thenReturn(Mono.empty());

        // When
        Map<String, Object> data = collected(collector());

        // Then
        assertThat(data)
                .containsEntry("mcpUnrevokedKeys", DiagnosticsValues.UNKNOWN)
                .containsEntry("mcpEnabled", false)
                .containsEntry("mcpProcess", DiagnosticsValues.UP);
    }

    @Test
    void should_neverCallAiConfigService_when_collecting() {
        // Given
        Constructor<?>[] constructors = AiMcpDiagnosticsCollectorCE.class.getDeclaredConstructors();

        // When
        boolean takesAiConfigService = Arrays.stream(constructors)
                .flatMap(constructor -> Arrays.stream(constructor.getParameterTypes()))
                .anyMatch(AIConfigServiceCE.class::isAssignableFrom);

        // Then
        assertThat(constructors).isNotEmpty();
        assertThat(takesAiConfigService).isFalse();
    }

    @Test
    void should_reportNotSupportedForEveryEeKey_when_ce() {
        // Given
        AiMcpDiagnosticsCollectorCE collector = collector();

        // When
        Map<String, Object> data = collected(collector);

        // Then
        assertThat(data.keySet()).endsWith(AiMcpDiagnosticsCollectorCE.EE_KEYS.toArray(String[]::new));
        for (String key : AiMcpDiagnosticsCollectorCE.EE_KEYS) {
            assertThat(data).containsEntry(key, DiagnosticsValues.NOT_SUPPORTED);
        }
    }

    @Test
    void should_declareOnlyStrictKinds_when_schemaBuilt() {
        // Given
        AiMcpDiagnosticsCollectorCE collector = collector();

        // When
        DiagnosticsSchema schema = collector.schema();

        // Then
        assertThat(schema.keys().values())
                .doesNotContain(
                        DiagnosticsSchema.ValueKind.FREE_TEXT,
                        DiagnosticsSchema.ValueKind.INSTANCE_ID,
                        DiagnosticsSchema.ValueKind.VERSION,
                        DiagnosticsSchema.ValueKind.DATE);
        assertThat(schema.keys()).containsKeys(AiMcpDiagnosticsCollectorCE.EE_KEYS.toArray(String[]::new));
        assertThat(schema.categoryValues().get("aiAssistantProvider"))
                .containsExactlyInAnyOrder("CLAUDE", "OPENAI", "AZURE_OPENAI", "LOCAL_LLM", DiagnosticsValues.OTHER);
        assertThat(schema.categoryValues().get("mcpProcess"))
                .containsExactlyInAnyOrder(DiagnosticsValues.UP, DiagnosticsValues.DOWN);
    }

    @Test
    void should_passTheRedactionGuard_when_collected() {
        // Given
        seedEverySensitiveField(givenAiConfig(AIProvider.OPENAI));
        McpConfig mcpConfig = new McpConfig();
        mcpConfig.setEnabled(true);
        configuration.setMcpConfig(mcpConfig);
        when(datasourceRepository.countByPluginIdForDiagnostics()).thenReturn(Mono.just(Map.of("p-openai", 3L)));
        when(pluginRepository.findAllByIdsWithoutPermission(any(), any()))
                .thenReturn(Flux.just(plugin("p-openai", "openai-plugin")));
        AiMcpDiagnosticsCollectorCE collector = collector();

        // When
        Map<String, Object> data = collected(collector);

        // Then
        assertThat(data)
                .containsEntry("aiAssistantEnabled", true)
                .containsEntry("aiAssistantProvider", "OPENAI")
                .containsEntry("aiAssistantCredentialPresent", true)
                .containsEntry("aiAssistantCustomBaseUrl", true)
                .containsEntry("mcpEnabled", true)
                .containsEntry("mcpInternalSecretConfigured", true)
                .containsEntry("mcpUnrevokedKeys", 2L)
                .containsEntry("mcpProcess", DiagnosticsValues.UP);
        assertThat(aiDatasources(data)).containsEntry("openai-plugin", 3L);
        assertThat(guard.violation(collector.schema(), data)).isEmpty();
    }
}
