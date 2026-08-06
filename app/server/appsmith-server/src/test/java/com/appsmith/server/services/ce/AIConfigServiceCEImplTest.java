package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.constants.ce.FieldNameCE;
import com.appsmith.server.domains.AIAssistantConfig;
import com.appsmith.server.domains.AIProvider;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.AIConfigDTO;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ce.AIConfigSecretsCE;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.SessionUserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.acl.AclPermission.MANAGE_ORGANIZATION;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AIConfigServiceCEImplTest {

    OrganizationService organizationService;
    AnalyticsService analyticsService;
    SessionUserService sessionUserService;
    AIConfigServiceCEImpl aiConfigService;

    @BeforeEach
    void setUp() {
        organizationService = Mockito.mock(OrganizationService.class);
        analyticsService = Mockito.mock(AnalyticsService.class);
        sessionUserService = Mockito.mock(SessionUserService.class);
        aiConfigService = new AIConfigServiceCEImpl(
                organizationService, new ObjectMapper(), analyticsService, sessionUserService);
    }

    /**
     * The authorization fix on getAIConfig had no test, and the mock in this class taught the wrong model of the
     * collaborator: OrganizationServiceCEImpl.findById ends in switchIfEmpty(Mono.error(...)), so it SIGNALS an
     * error for a caller without MANAGE_ORGANIZATION — it never completes empty. Both editions share that
     * implementation. A switchIfEmpty-based fallback was therefore dead code, and every non-manager received an
     * error instead of the enablement flags the editor reads on session start. These two tests pin both halves
     * against the real behaviour.
     */
    @Test
    void getAIConfig_managerReceivesTheFullConfiguration() {
        Organization organization = new Organization();
        OrganizationConfiguration configuration = new OrganizationConfiguration();
        AIAssistantConfig aiConfig = new AIAssistantConfig();
        aiConfig.setIsAIAssistantEnabled(true);
        aiConfig.setAiProvider(AIProvider.AZURE_OPENAI);
        aiConfig.setAzureOpenaiEndpoint("https://contoso.openai.azure.com");
        aiConfig.setAzureOpenaiDeploymentName("gpt4o-prod");
        aiConfig.setLocalLlmUrl("http://ollama.internal:11434/api/generate");
        configuration.setAiAssistantConfig(aiConfig);
        organization.setOrganizationConfiguration(configuration);

        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-1"));
        when(organizationService.findById("org-1", MANAGE_ORGANIZATION)).thenReturn(Mono.just(organization));

        StepVerifier.create(aiConfigService.getAIConfig())
                .assertNext(response -> assertThat(response)
                        .containsEntry("azureOpenaiEndpoint", "https://contoso.openai.azure.com")
                        .containsEntry("azureOpenaiDeploymentName", "gpt4o-prod")
                        .containsEntry("localLlmUrl", "http://ollama.internal:11434/api/generate"))
                .verifyComplete();
    }

    @Test
    void getAIConfig_nonManagerReceivesStatusOnly_andNoInfrastructureDetail() {
        Organization organization = new Organization();
        OrganizationConfiguration configuration = new OrganizationConfiguration();
        AIAssistantConfig aiConfig = new AIAssistantConfig();
        aiConfig.setIsAIAssistantEnabled(true);
        aiConfig.setAiProvider(AIProvider.AZURE_OPENAI);
        aiConfig.setAzureOpenaiEndpoint("https://contoso.openai.azure.com");
        aiConfig.setAzureOpenaiDeploymentName("gpt4o-prod");
        aiConfig.setLocalLlmUrl("http://ollama.internal:11434/api/generate");
        aiConfig.setAzureOpenaiApiKey("super-secret");
        configuration.setAiAssistantConfig(aiConfig);
        organization.setOrganizationConfiguration(configuration);

        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-1"));
        // The real collaborator ERRORS rather than completing empty when the permission is absent.
        when(organizationService.findById("org-1", MANAGE_ORGANIZATION))
                .thenReturn(Mono.error(new AppsmithException(
                        com.appsmith.server.exceptions.AppsmithError.NO_RESOURCE_FOUND,
                        FieldNameCE.ORGANIZATION_ID,
                        "org-1")));
        when(organizationService.getCurrentUserOrganization()).thenReturn(Mono.just(organization));

        StepVerifier.create(aiConfigService.getAIConfig())
                .assertNext(response -> {
                    // What the editor legitimately needs.
                    assertThat(response).containsEntry("isAIAssistantEnabled", true);
                    // What describes internal infrastructure and must never reach a non-manager.
                    assertThat(response)
                            .doesNotContainKeys(
                                    "azureOpenaiEndpoint",
                                    "azureOpenaiDeploymentName",
                                    "localLlmUrl",
                                    "azureOpenaiApiKey",
                                    "claudeApiKey",
                                    "openaiApiKey");
                    assertThat(response.values()).doesNotContain("super-secret");
                })
                .verifyComplete();
    }

    @Test
    void updateAIConfig_emitsAnalytics_whenAnalyticsActive_andEnabled() {
        when(analyticsService.isActive()).thenReturn(true);
        when(analyticsService.sendEvent(anyString(), anyString(), any(Map.class)))
                .thenReturn(Mono.empty());

        User admin = new User();
        admin.setEmail("admin@example.com");
        when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(admin));

        Organization org = new Organization();
        org.setId("org-1");
        OrganizationConfiguration config = new OrganizationConfiguration();
        AIAssistantConfig ac = new AIAssistantConfig();
        ac.setAiProvider(AIProvider.CLAUDE);
        ac.setIsAIAssistantEnabled(false);
        config.setAiAssistantConfig(ac);
        org.setOrganizationConfiguration(config);

        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-1"));
        when(organizationService.findById("org-1", MANAGE_ORGANIZATION)).thenReturn(Mono.just(org));
        when(organizationService.updateOrganizationConfiguration(eq("org-1"), any(OrganizationConfiguration.class)))
                .thenAnswer(invocation -> {
                    Organization out = new Organization();
                    out.setId("org-1");
                    out.setOrganizationConfiguration(invocation.getArgument(1));
                    return Mono.just(out);
                });

        AIConfigDTO dto = new AIConfigDTO();
        dto.setProvider(AIProvider.CLAUDE);
        dto.setIsAIAssistantEnabled(true);
        dto.setClaudeModel("claude-sonnet-4");

        StepVerifier.create(aiConfigService.updateAIConfig(dto))
                .expectNextCount(1)
                .verifyComplete();

        ArgumentCaptor<Map> captor = ArgumentCaptor.forClass(Map.class);
        verify(analyticsService, times(1))
                .sendEvent(
                        eq(AnalyticsEvents.ASK_AI_ORG_CONFIG_UPDATED.getEventName()),
                        eq("admin@example.com"),
                        captor.capture());
        Map<String, Object> props = captor.getValue();
        assertThat(props.get("isAIAssistantEnabled")).isEqualTo(true);
        assertThat(props.get("provider")).isEqualTo("CLAUDE");
        assertThat(props.get("claudeModel")).isEqualTo("claude-sonnet-4");
        assertThat(props.get(FieldNameCE.ORGANIZATION_ID)).isEqualTo("org-1");
    }

    @Test
    void updateAIConfig_emitsAnalytics_whenDisabled() {
        when(analyticsService.isActive()).thenReturn(true);
        when(analyticsService.sendEvent(anyString(), anyString(), any(Map.class)))
                .thenReturn(Mono.empty());

        User admin = new User();
        admin.setEmail("admin@example.com");
        when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(admin));

        Organization org = new Organization();
        org.setId("org-2");
        OrganizationConfiguration config = new OrganizationConfiguration();
        AIAssistantConfig ac = new AIAssistantConfig();
        ac.setAiProvider(AIProvider.OPENAI);
        ac.setIsAIAssistantEnabled(true);
        config.setAiAssistantConfig(ac);
        org.setOrganizationConfiguration(config);

        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-2"));
        when(organizationService.findById("org-2", MANAGE_ORGANIZATION)).thenReturn(Mono.just(org));
        when(organizationService.updateOrganizationConfiguration(eq("org-2"), any(OrganizationConfiguration.class)))
                .thenAnswer(invocation -> {
                    Organization out = new Organization();
                    out.setId("org-2");
                    out.setOrganizationConfiguration(invocation.getArgument(1));
                    return Mono.just(out);
                });

        AIConfigDTO dto = new AIConfigDTO();
        dto.setProvider(AIProvider.OPENAI);
        dto.setIsAIAssistantEnabled(false);
        dto.setOpenaiModel("gpt-4");

        StepVerifier.create(aiConfigService.updateAIConfig(dto))
                .expectNextCount(1)
                .verifyComplete();

        ArgumentCaptor<Map> captor = ArgumentCaptor.forClass(Map.class);
        verify(analyticsService, times(1))
                .sendEvent(
                        eq(AnalyticsEvents.ASK_AI_ORG_CONFIG_UPDATED.getEventName()),
                        eq("admin@example.com"),
                        captor.capture());
        Map<String, Object> props = captor.getValue();
        assertThat(props.get("isAIAssistantEnabled")).isEqualTo(false);
        assertThat(props.get("provider")).isEqualTo("OPENAI");
        assertThat(props.get("openaiModel")).isEqualTo("gpt-4");
    }

    @Test
    void updateAIConfig_skipsAnalytics_whenInactive() {
        when(analyticsService.isActive()).thenReturn(false);

        Organization org = new Organization();
        org.setId("org-3");
        OrganizationConfiguration config = new OrganizationConfiguration();
        AIAssistantConfig ac = new AIAssistantConfig();
        ac.setAiProvider(AIProvider.CLAUDE);
        config.setAiAssistantConfig(ac);
        org.setOrganizationConfiguration(config);

        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-3"));
        when(organizationService.findById("org-3", MANAGE_ORGANIZATION)).thenReturn(Mono.just(org));
        when(organizationService.updateOrganizationConfiguration(eq("org-3"), any(OrganizationConfiguration.class)))
                .thenAnswer(invocation -> {
                    Organization out = new Organization();
                    out.setId("org-3");
                    out.setOrganizationConfiguration(invocation.getArgument(1));
                    return Mono.just(out);
                });

        AIConfigDTO dto = new AIConfigDTO();
        dto.setProvider(AIProvider.CLAUDE);
        dto.setIsAIAssistantEnabled(true);

        StepVerifier.create(aiConfigService.updateAIConfig(dto))
                .expectNextCount(1)
                .verifyComplete();

        verify(analyticsService, never()).sendEvent(anyString(), anyString(), any(Map.class));
        verify(sessionUserService, never()).getCurrentUser();
    }

    @Test
    void updateAIConfig_orgNotFound_returnsErrorWithoutAnalytics() {
        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("missing"));
        when(organizationService.findById("missing", MANAGE_ORGANIZATION)).thenReturn(Mono.empty());

        AIConfigDTO dto = new AIConfigDTO();
        dto.setProvider(AIProvider.CLAUDE);
        dto.setIsAIAssistantEnabled(true);

        StepVerifier.create(aiConfigService.updateAIConfig(dto))
                .expectError(AppsmithException.class)
                .verify();

        verify(analyticsService, never()).sendEvent(anyString(), anyString(), any(Map.class));
    }

    @Test
    void testApiKey_emitsTestAnalytics_whenAnalyticsActive() {
        when(analyticsService.isActive()).thenReturn(true);
        when(analyticsService.sendEvent(anyString(), anyString(), any(Map.class)))
                .thenReturn(Mono.empty());

        User admin = new User();
        admin.setEmail("admin@example.com");
        when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(admin));

        Organization org = new Organization();
        org.setId("org-t1");
        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-t1"));
        when(organizationService.findById("org-t1", MANAGE_ORGANIZATION)).thenReturn(Mono.just(org));

        StepVerifier.create(aiConfigService.testApiKey(new HashMap<>()))
                .expectNextMatches(r -> Boolean.FALSE.equals(r.get("success")))
                .verifyComplete();

        ArgumentCaptor<Map> captor = ArgumentCaptor.forClass(Map.class);
        verify(analyticsService, times(1))
                .sendEvent(
                        eq(AnalyticsEvents.ASK_AI_ORG_TEST_RUN.getEventName()),
                        eq("admin@example.com"),
                        captor.capture());
        Map<String, Object> props = captor.getValue();
        assertThat(props.get("testKind")).isEqualTo("API_KEY");
        assertThat(props.get("success")).isEqualTo(false);
        assertThat(props.get(FieldNameCE.ORGANIZATION_ID)).isEqualTo("org-t1");
        assertThat(String.valueOf(props.get("errorSummary"))).contains("Provider");
    }

    @Test
    void testLlmConnection_emitsTestAnalytics_whenAnalyticsActive() {
        when(analyticsService.isActive()).thenReturn(true);
        when(analyticsService.sendEvent(anyString(), anyString(), any(Map.class)))
                .thenReturn(Mono.empty());

        User admin = new User();
        admin.setEmail("admin@example.com");
        when(sessionUserService.getCurrentUser()).thenReturn(Mono.just(admin));

        Organization org = new Organization();
        org.setId("org-t2");
        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-t2"));
        when(organizationService.findById("org-t2", MANAGE_ORGANIZATION)).thenReturn(Mono.just(org));

        StepVerifier.create(aiConfigService.testLlmConnection(new HashMap<>()))
                .expectNextMatches(r -> Boolean.FALSE.equals(r.get("success")))
                .verifyComplete();

        ArgumentCaptor<Map> captor = ArgumentCaptor.forClass(Map.class);
        verify(analyticsService, times(1))
                .sendEvent(
                        eq(AnalyticsEvents.ASK_AI_ORG_TEST_RUN.getEventName()),
                        eq("admin@example.com"),
                        captor.capture());
        Map<String, Object> props = captor.getValue();
        assertThat(props.get("testKind")).isEqualTo("LOCAL_LLM_CONNECTION");
        assertThat(props.get("success")).isEqualTo(false);
        assertThat(String.valueOf(props.get("errorSummary"))).contains("URL");
    }

    /**
     * A saved credential must only ever travel to the destination the administrator saved. Honouring a
     * request-supplied host would let anyone who can reach this endpoint read back a key that the UI
     * deliberately masks, by pointing the test at a collector they control.
     *
     * <p>Each of these gives the request an HTTPS destination and the saved configuration a plain HTTP
     * one. The refusal is what proves the saved value won: had the request value been used, it would
     * have passed the transport check and gone on to a real provider call.
     */
    @Test
    void testApiKey_withStoredKey_ignoresRequestSuppliedBaseUrl() {
        Organization org = new Organization();
        org.setId("org-p1");
        OrganizationConfiguration configuration = new OrganizationConfiguration();
        AIAssistantConfig aiConfig = new AIAssistantConfig();
        aiConfig.setOpenaiApiKey("sk-stored-openai-key");
        aiConfig.setOpenaiBaseUrl("http://attacker.example.com");
        configuration.setAiAssistantConfig(aiConfig);
        org.setOrganizationConfiguration(configuration);

        when(analyticsService.isActive()).thenReturn(false);
        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-p1"));
        when(organizationService.findById("org-p1", MANAGE_ORGANIZATION)).thenReturn(Mono.just(org));
        when(organizationService.getCurrentUserOrganization()).thenReturn(Mono.just(org));

        Map<String, String> request = new HashMap<>();
        request.put("provider", "OPENAI");
        request.put("baseUrl", "https://api.openai.com");

        StepVerifier.create(aiConfigService.testApiKey(request))
                .assertNext(response -> {
                    assertThat(response).containsEntry("success", false);
                    assertThat(String.valueOf(response.get("error"))).contains("HTTPS");
                })
                .verifyComplete();
    }

    @Test
    void testApiKey_withStoredKey_ignoresRequestSuppliedAzureEndpoint() {
        Organization org = new Organization();
        org.setId("org-p2");
        OrganizationConfiguration configuration = new OrganizationConfiguration();
        AIAssistantConfig aiConfig = new AIAssistantConfig();
        aiConfig.setAzureOpenaiApiKey("sk-stored-azure-key-1234567890");
        aiConfig.setAzureOpenaiEndpoint("http://attacker.example.com");
        configuration.setAiAssistantConfig(aiConfig);
        org.setOrganizationConfiguration(configuration);

        when(analyticsService.isActive()).thenReturn(false);
        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-p2"));
        when(organizationService.findById("org-p2", MANAGE_ORGANIZATION)).thenReturn(Mono.just(org));
        when(organizationService.getCurrentUserOrganization()).thenReturn(Mono.just(org));

        Map<String, String> request = new HashMap<>();
        request.put("provider", "AZURE_OPENAI");
        request.put("endpoint", "https://contoso.openai.azure.com");
        request.put("deploymentName", "gpt4o-prod");

        StepVerifier.create(aiConfigService.testApiKey(request))
                .assertNext(response -> {
                    assertThat(response).containsEntry("success", false);
                    assertThat(String.valueOf(response.get("error"))).contains("HTTPS");
                })
                .verifyComplete();
    }

    /**
     * The counterpart: an HTTPS destination taken from the saved configuration is accepted, and it is
     * that saved endpoint the test proceeds with. Stopping at the missing deployment name keeps this
     * off the network while still proving the request got past the transport check.
     */
    @Test
    void testApiKey_withStoredKey_usesTheConfiguredHttpsEndpoint() {
        Organization org = new Organization();
        org.setId("org-p3");
        OrganizationConfiguration configuration = new OrganizationConfiguration();
        AIAssistantConfig aiConfig = new AIAssistantConfig();
        aiConfig.setAzureOpenaiApiKey("sk-stored-azure-key-1234567890");
        aiConfig.setAzureOpenaiEndpoint("https://contoso.openai.azure.com");
        configuration.setAiAssistantConfig(aiConfig);
        org.setOrganizationConfiguration(configuration);

        when(analyticsService.isActive()).thenReturn(false);
        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-p3"));
        when(organizationService.findById("org-p3", MANAGE_ORGANIZATION)).thenReturn(Mono.just(org));
        when(organizationService.getCurrentUserOrganization()).thenReturn(Mono.just(org));

        Map<String, String> request = new HashMap<>();
        request.put("provider", "AZURE_OPENAI");

        StepVerifier.create(aiConfigService.testApiKey(request))
                .assertNext(response -> {
                    assertThat(response).containsEntry("success", false);
                    assertThat(String.valueOf(response.get("error"))).contains("Deployment name");
                })
                .verifyComplete();
    }

    /**
     * Pinning the test request to the saved destination stopped a caller naming the host inline, but
     * not the same attack in two steps: save a new base URL with the key field blank — which means
     * "unchanged", so the key survives — and the stored credential now points wherever the caller
     * likes. Testing it, or just using the assistant, then sends it there. Binding the credential to
     * its destination removes that step.
     */
    @Test
    void updateAIConfig_clearsTheStoredKey_whenTheDestinationChangesWithoutANewKey() {
        Organization org = organizationWithStoredClaudeKey("https://api.anthropic.com");

        when(analyticsService.isActive()).thenReturn(false);
        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-r1"));
        when(organizationService.findById("org-r1", MANAGE_ORGANIZATION)).thenReturn(Mono.just(org));
        when(organizationService.updateOrganizationConfiguration(eq("org-r1"), any(OrganizationConfiguration.class)))
                .thenAnswer(invocation -> {
                    Organization out = new Organization();
                    out.setId("org-r1");
                    out.setOrganizationConfiguration(invocation.getArgument(1));
                    return Mono.just(out);
                });

        AIConfigDTO dto = new AIConfigDTO();
        dto.setClaudeBaseUrl("https://attacker.example.com");

        StepVerifier.create(aiConfigService.updateAIConfig(dto))
                .expectNextCount(1)
                .verifyComplete();

        ArgumentCaptor<OrganizationConfiguration> captor = ArgumentCaptor.forClass(OrganizationConfiguration.class);
        verify(organizationService).updateOrganizationConfiguration(eq("org-r1"), captor.capture());
        AIAssistantConfig saved = captor.getValue().getAiAssistantConfig();

        assertThat(saved.getClaudeBaseUrl()).isEqualTo("https://attacker.example.com");
        assertThat(saved.getClaudeApiKey()).isNull();
    }

    @Test
    void updateAIConfig_keepsTheStoredKey_whenTheDestinationIsUnchanged() {
        Organization org = organizationWithStoredClaudeKey("https://api.anthropic.com");
        String storedKey =
                org.getOrganizationConfiguration().getAiAssistantConfig().getClaudeApiKey();

        when(analyticsService.isActive()).thenReturn(false);
        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-r2"));
        when(organizationService.findById("org-r2", MANAGE_ORGANIZATION)).thenReturn(Mono.just(org));
        when(organizationService.updateOrganizationConfiguration(eq("org-r2"), any(OrganizationConfiguration.class)))
                .thenAnswer(invocation -> {
                    Organization out = new Organization();
                    out.setId("org-r2");
                    out.setOrganizationConfiguration(invocation.getArgument(1));
                    return Mono.just(out);
                });

        AIConfigDTO dto = new AIConfigDTO();
        dto.setClaudeBaseUrl("https://api.anthropic.com");
        dto.setClaudeModel("claude-sonnet-4");

        StepVerifier.create(aiConfigService.updateAIConfig(dto))
                .expectNextCount(1)
                .verifyComplete();

        ArgumentCaptor<OrganizationConfiguration> captor = ArgumentCaptor.forClass(OrganizationConfiguration.class);
        verify(organizationService).updateOrganizationConfiguration(eq("org-r2"), captor.capture());

        assertThat(captor.getValue().getAiAssistantConfig().getClaudeApiKey()).isEqualTo(storedKey);
    }

    @Test
    void updateAIConfig_keepsTheNewKey_whenTheDestinationChangesAndAKeyIsSupplied() {
        Organization org = organizationWithStoredClaudeKey("https://api.anthropic.com");

        when(analyticsService.isActive()).thenReturn(false);
        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-r3"));
        when(organizationService.findById("org-r3", MANAGE_ORGANIZATION)).thenReturn(Mono.just(org));
        when(organizationService.updateOrganizationConfiguration(eq("org-r3"), any(OrganizationConfiguration.class)))
                .thenAnswer(invocation -> {
                    Organization out = new Organization();
                    out.setId("org-r3");
                    out.setOrganizationConfiguration(invocation.getArgument(1));
                    return Mono.just(out);
                });

        AIConfigDTO dto = new AIConfigDTO();
        dto.setClaudeBaseUrl("https://proxy.example.com");
        dto.setClaudeApiKey("sk-brand-new-key");

        StepVerifier.create(aiConfigService.updateAIConfig(dto))
                .expectNextCount(1)
                .verifyComplete();

        ArgumentCaptor<OrganizationConfiguration> captor = ArgumentCaptor.forClass(OrganizationConfiguration.class);
        verify(organizationService).updateOrganizationConfiguration(eq("org-r3"), captor.capture());
        AIAssistantConfig saved = captor.getValue().getAiAssistantConfig();

        assertThat(saved.getClaudeApiKey()).isNotNull();
        assertThat(AIConfigSecretsCE.decrypt(saved.getClaudeApiKey())).isEqualTo("sk-brand-new-key");
    }

    private Organization organizationWithStoredClaudeKey(String baseUrl) {
        Organization org = new Organization();
        org.setId("org");
        OrganizationConfiguration configuration = new OrganizationConfiguration();
        AIAssistantConfig aiConfig = new AIAssistantConfig();
        aiConfig.setClaudeApiKey(AIConfigSecretsCE.encrypt("sk-stored-claude-key"));
        aiConfig.setClaudeBaseUrl(baseUrl);
        configuration.setAiAssistantConfig(aiConfig);
        org.setOrganizationConfiguration(configuration);
        return org;
    }

    @Test
    void testApiKey_skipsTestAnalytics_whenInactive() {
        when(analyticsService.isActive()).thenReturn(false);

        Organization org = new Organization();
        org.setId("org-t3");
        when(organizationService.getCurrentUserOrganizationId()).thenReturn(Mono.just("org-t3"));
        when(organizationService.findById("org-t3", MANAGE_ORGANIZATION)).thenReturn(Mono.just(org));

        StepVerifier.create(aiConfigService.testApiKey(new HashMap<>()))
                .expectNextCount(1)
                .verifyComplete();

        verify(analyticsService, never()).sendEvent(anyString(), anyString(), any(Map.class));
        verify(sessionUserService, never()).getCurrentUser();
    }
}
