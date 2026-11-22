package com.appsmith.server.diagnostics.collectors;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.AIConstants;
import com.appsmith.server.diagnostics.DiagnosticsValues;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.domains.AIAssistantConfig;
import com.appsmith.server.domains.AIProvider;
import com.appsmith.server.domains.McpConfig;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.McpKeyRepository;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.OrganizationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.TimeoutException;
import java.util.stream.Collectors;

/**
 * Reports whether the AI assistant is on, its provider, and whether that provider has a credential and a custom base
 * URL. Also reports the AI datasource counts by plugin, and the MCP switch, internal secret, unrevoked key count and
 * process status. In EE, it also reports the AI agent entitlement, the agent application count and the AI server
 * settings.
 *
 * <p>It checks secrets and URLs for presence only. It never reports a key, an endpoint, a deployment, a model or a
 * base URL, and never calls {@code AIConfigService}.
 *
 * <p>Each CE read has its own time limit, so a slow read reports {@code UNKNOWN} for its own keys only.
 */
@Slf4j
public class AiMcpDiagnosticsCollectorCE implements DiagnosticsCollector {

    protected static final List<String> EE_KEYS = List.of(
            "aiAgentsEntitled",
            "aiAgentInstance",
            "aiAgentApplications",
            "aiServerManagedHosting",
            "aiServerKeyPresent");

    /** The providers this section reports. {@code COPILOT} reports {@code AZURE_OPENAI}. */
    protected static final Set<String> AI_PROVIDERS = Set.of(
            AIProvider.CLAUDE.name(),
            AIProvider.OPENAI.name(),
            AIProvider.AZURE_OPENAI.name(),
            AIProvider.LOCAL_LLM.name());

    /** The nested keys of {@code aiDatasourcesByPlugin}, in key order. */
    private static final Set<String> AI_PLUGIN_KEYS = new TreeSet<>(DiagnosticsPluginBuckets.AI_PACKAGE_NAMES);

    private static final DiagnosticsSchema SCHEMA = DiagnosticsSchema.builder()
            .key("aiAssistantEnabled", DiagnosticsSchema.ValueKind.BOOLEAN)
            .category("aiAssistantProvider", withOther(AI_PROVIDERS))
            .key("aiAssistantCredentialPresent", DiagnosticsSchema.ValueKind.BOOLEAN)
            .key("aiAssistantCustomBaseUrl", DiagnosticsSchema.ValueKind.BOOLEAN)
            .map("aiDatasourcesByPlugin", AI_PLUGIN_KEYS)
            .key("mcpEnabled", DiagnosticsSchema.ValueKind.BOOLEAN)
            .key("mcpInternalSecretConfigured", DiagnosticsSchema.ValueKind.BOOLEAN)
            .key("mcpUnrevokedKeys", DiagnosticsSchema.ValueKind.COUNT)
            .category("mcpProcess", DiagnosticsValues.UP, DiagnosticsValues.DOWN)
            .key("aiAgentsEntitled", DiagnosticsSchema.ValueKind.BOOLEAN)
            .key("aiAgentInstance", DiagnosticsSchema.ValueKind.BOOLEAN)
            .key("aiAgentApplications", DiagnosticsSchema.ValueKind.COUNT)
            .key("aiServerManagedHosting", DiagnosticsSchema.ValueKind.BOOLEAN)
            .key("aiServerKeyPresent", DiagnosticsSchema.ValueKind.BOOLEAN)
            .build();

    private final OrganizationService organizationService;
    private final DatasourceRepository datasourceRepository;
    private final PluginRepository pluginRepository;
    private final McpKeyRepository mcpKeyRepository;
    private final DiagnosticsLoopbackProbe loopbackProbe;
    private final CommonConfig commonConfig;

    public AiMcpDiagnosticsCollectorCE(
            OrganizationService organizationService,
            DatasourceRepository datasourceRepository,
            PluginRepository pluginRepository,
            McpKeyRepository mcpKeyRepository,
            DiagnosticsLoopbackProbe loopbackProbe,
            CommonConfig commonConfig) {
        this.organizationService = organizationService;
        this.datasourceRepository = datasourceRepository;
        this.pluginRepository = pluginRepository;
        this.mcpKeyRepository = mcpKeyRepository;
        this.loopbackProbe = loopbackProbe;
        this.commonConfig = commonConfig;
    }

    @Override
    public DiagnosticsSectionId sectionId() {
        return DiagnosticsSectionId.AI_MCP;
    }

    @Override
    public DiagnosticsSchema schema() {
        return SCHEMA;
    }

    @Override
    public Mono<Map<String, Object>> collect(String organizationId) {
        Mono<Optional<OrganizationConfiguration>> configuration = boundedRead(
                "organization",
                Mono.defer(() -> organizationService.retrieveById(organizationId))
                        .map(organization -> Optional.ofNullable(organization.getOrganizationConfiguration())),
                Optional.empty());
        Mono<Map<String, Object>> aiDatasources = boundedRead(
                "aiDatasourcesByPlugin",
                Mono.defer(this::aiDatasourcesByPlugin),
                DiagnosticsValues.allWith(AI_PLUGIN_KEYS, DiagnosticsValues.UNKNOWN));
        Mono<Object> unrevokedKeys = boundedRead(
                "mcpUnrevokedKeys", Mono.defer(mcpKeyRepository::countActiveForDiagnostics), DiagnosticsValues.UNKNOWN);
        // The probe has its own shorter time limit and never emits an error.
        Mono<String> mcpProcess = Mono.defer(loopbackProbe::mcp);

        Mono<Map<String, Object>> ceData = Mono.zip(configuration, aiDatasources, unrevokedKeys, mcpProcess)
                .map(parts -> {
                    Map<String, Object> data = new LinkedHashMap<>();
                    putAiAssistant(data, parts.getT1().orElse(null));
                    data.put("aiDatasourcesByPlugin", parts.getT2());
                    data.put(
                            "mcpEnabled",
                            parts.getT1()
                                    .<Object>map(config -> mcpEnabled(config.getMcpConfig()))
                                    .orElse(DiagnosticsValues.UNKNOWN));
                    data.put("mcpInternalSecretConfigured", StringUtils.hasText(commonConfig.getMcpInternalSecret()));
                    data.put("mcpUnrevokedKeys", parts.getT3());
                    data.put("mcpProcess", parts.getT4());
                    return data;
                });

        // The EE stage starts with the CE reads, so both share the section time limit.
        return DiagnosticsEeFields.merge(ceData, () -> eeFields(organizationId), EE_KEYS, "ai-mcp");
    }

    /**
     * The values of the EE-only keys in {@link #EE_KEYS}. CE does not support them.
     */
    protected Mono<Map<String, Object>> eeFields(String organizationId) {
        return Mono.just(DiagnosticsValues.allNotSupported(EE_KEYS));
    }

    /**
     * Puts the AI assistant keys. A null organization configuration gives {@code UNKNOWN} for each key. A null AI
     * configuration means the assistant was never set up, so it is off and has no provider.
     */
    private static void putAiAssistant(Map<String, Object> data, OrganizationConfiguration configuration) {
        if (configuration == null) {
            data.put("aiAssistantEnabled", DiagnosticsValues.UNKNOWN);
            data.put("aiAssistantProvider", DiagnosticsValues.UNKNOWN);
            data.put("aiAssistantCredentialPresent", DiagnosticsValues.UNKNOWN);
            data.put("aiAssistantCustomBaseUrl", DiagnosticsValues.UNKNOWN);
            return;
        }
        AIAssistantConfig aiConfig = configuration.getAiAssistantConfig();
        AIProvider provider = aiConfig == null ? null : aiConfig.getAiProvider();
        data.put("aiAssistantEnabled", aiConfig != null && Boolean.TRUE.equals(aiConfig.getIsAIAssistantEnabled()));
        data.put("aiAssistantProvider", provider(provider));
        data.put("aiAssistantCredentialPresent", provider == null ? DiagnosticsValues.UNKNOWN : credential(aiConfig));
        data.put("aiAssistantCustomBaseUrl", provider == null ? DiagnosticsValues.UNKNOWN : customBaseUrl(aiConfig));
    }

    /** Maps a provider to a fixed value. {@code COPILOT} gives {@code AZURE_OPENAI}, and null gives {@code UNKNOWN}. */
    private static String provider(AIProvider provider) {
        if (provider == null) {
            return DiagnosticsValues.UNKNOWN;
        }
        String name = provider == AIProvider.COPILOT ? AIProvider.AZURE_OPENAI.name() : provider.name();
        return AI_PROVIDERS.contains(name) ? name : DiagnosticsValues.OTHER;
    }

    /** Whether the selected provider has a credential. Azure accepts either of its two key fields. */
    private static Object credential(AIAssistantConfig aiConfig) {
        return switch (aiConfig.getAiProvider()) {
            case CLAUDE -> StringUtils.hasText(aiConfig.getClaudeApiKey());
            case OPENAI -> StringUtils.hasText(aiConfig.getOpenaiApiKey());
            case AZURE_OPENAI, COPILOT ->
                StringUtils.hasText(aiConfig.getAzureOpenaiApiKey())
                        || StringUtils.hasText(aiConfig.getCopilotApiKey());
            case LOCAL_LLM -> StringUtils.hasText(aiConfig.getLocalLlmUrl());
        };
    }

    /**
     * Whether Claude or OpenAI has a custom base URL. A stored provider default is not custom. Other providers have
     * none, so they give NOT_APPLICABLE.
     */
    private static Object customBaseUrl(AIAssistantConfig aiConfig) {
        return switch (aiConfig.getAiProvider()) {
            case CLAUDE -> isCustomBaseUrl(aiConfig.getClaudeBaseUrl(), AIConstants.DEFAULT_CLAUDE_BASE_URL);
            case OPENAI -> isCustomBaseUrl(aiConfig.getOpenaiBaseUrl(), AIConstants.DEFAULT_OPENAI_BASE_URL);
            default -> DiagnosticsValues.NOT_APPLICABLE;
        };
    }

    /** Compares without surrounding spaces, trailing slashes, or case, so a stored default is not custom. */
    private static boolean isCustomBaseUrl(String baseUrl, String defaultBaseUrl) {
        if (!StringUtils.hasText(baseUrl)) {
            return false;
        }
        String normalized = baseUrl.trim().replaceAll("/+$", "");
        return !normalized.equalsIgnoreCase(defaultBaseUrl);
    }

    private static boolean mcpEnabled(McpConfig mcpConfig) {
        return mcpConfig != null && Boolean.TRUE.equals(mcpConfig.getEnabled());
    }

    /**
     * Counts datasources for each AI plugin package, with zero for a package that has none. It looks up the package
     * names of all plugins in use with one query, and makes no query when there is no datasource.
     */
    private Mono<Map<String, Object>> aiDatasourcesByPlugin() {
        return datasourceRepository.countByPluginIdForDiagnostics().flatMap(counts -> {
            Set<String> pluginIds =
                    counts.keySet().stream().filter(StringUtils::hasText).collect(Collectors.toSet());
            Mono<Map<String, String>> packageNames = pluginIds.isEmpty()
                    ? Mono.just(Map.of())
                    : pluginRepository
                            .findAllByIdsWithoutPermission(
                                    pluginIds, List.of(Plugin.Fields.packageName, BaseDomain.Fields.policyMap))
                            .collect(
                                    HashMap::new,
                                    (names, plugin) -> names.put(plugin.getId(), plugin.getPackageName()));
            return packageNames.map(names -> {
                Map<String, Long> folded = DiagnosticsPluginBuckets.foldByBucket(counts, names);
                Map<String, Object> result = new LinkedHashMap<>();
                for (String key : AI_PLUGIN_KEYS) {
                    result.put(key, folded.getOrDefault(key, 0L));
                }
                return result;
            });
        });
    }

    /**
     * Bounds one CE read by {@link DiagnosticsValues#EE_READ_TIMEOUT}. An error, an empty result, or no result in time
     * gives {@code fallback}, so only the keys this read feeds lose their values. The log names the read and the error
     * class only. A timeout logs at debug level and any other error at warn level, so a broken read stays visible.
     */
    private static <T> Mono<T> boundedRead(String key, Mono<? extends T> read, T fallback) {
        Mono<T> value = read.map(result -> result);
        return value.timeout(DiagnosticsValues.EE_READ_TIMEOUT)
                .onErrorResume(error -> {
                    if (error instanceof TimeoutException) {
                        log.debug(
                                "Support diagnostics ai-mcp read {} timed out with {}",
                                key,
                                error.getClass().getName());
                    } else {
                        log.warn(
                                "Support diagnostics ai-mcp read {} failed with {}",
                                key,
                                error.getClass().getName());
                    }
                    return Mono.just(fallback);
                })
                .defaultIfEmpty(fallback);
    }

    private static String[] withOther(Set<String> values) {
        Set<String> sorted = new TreeSet<>(values);
        sorted.add(DiagnosticsValues.OTHER);
        return sorted.toArray(String[]::new);
    }
}
