package com.appsmith.server.services.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.McpConfig;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.helpers.UserOrganizationHelper;
import com.appsmith.server.instanceconfigs.helpers.InstanceVariablesHelper;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.EnvManager;
import io.micrometer.observation.ObservationRegistry;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Covers {@link OrganizationServiceCEImpl#repairMcpInternalSecretOnStartup()}. The repair must create the secret only
 * when MCP is on, and the backend must use only a value that is on the env file, so the backend and the MCP process
 * never hold different values.
 */
class OrganizationServiceCEImplMcpSecretRepairTest {

    private static final String SECRET_KEY = "APPSMITH_MCP_INTERNAL_SECRET";

    private OrganizationRepository repository;
    private EnvManager envManager;
    private CommonConfig commonConfig;
    private OrganizationServiceCEImpl service;

    /** The secret on the fake env file. Starts empty. */
    private AtomicReference<String> onFile;

    @BeforeEach
    void setUp() {
        repository = mock(OrganizationRepository.class);
        envManager = mock(EnvManager.class);
        commonConfig = new CommonConfig();
        commonConfig.setMcpInternalSecret("");
        commonConfig.setEnvFilePath("/appsmith-stacks/configuration/docker.env");
        when(envManager.restartMcpWithoutAclCheck()).thenReturn(Mono.empty());

        // A working env file by default, so a test that expects no write fails if the code writes anyway.
        onFile = new AtomicReference<>("");
        when(envManager.getAllWithoutAclCheck()).thenAnswer(invocation -> Mono.just(Map.of(SECRET_KEY, onFile.get())));
        when(envManager.persistMcpInternalSecret(anyString())).thenAnswer(invocation -> {
            onFile.set(invocation.getArgument(0));
            return Mono.empty();
        });

        service = new OrganizationServiceCEImpl(
                mock(Validator.class),
                repository,
                mock(AnalyticsService.class),
                mock(ConfigService.class),
                envManager,
                mock(FeatureFlagMigrationHelper.class),
                mock(CacheableRepositoryHelper.class),
                commonConfig,
                ObservationRegistry.NOOP,
                mock(UserOrganizationHelper.class),
                mock(InstanceVariablesHelper.class));
    }

    private static Organization organizationWithMcp(Boolean enabled) {
        McpConfig mcpConfig = new McpConfig();
        mcpConfig.setEnabled(enabled);
        OrganizationConfiguration configuration = new OrganizationConfiguration();
        configuration.setMcpConfig(mcpConfig);
        Organization organization = new Organization();
        organization.setOrganizationConfiguration(configuration);
        return organization;
    }

    @Test
    void secretAlreadySet_doesNothing() {
        commonConfig.setMcpInternalSecret("existing-secret");

        StepVerifier.create(service.repairMcpInternalSecretOnStartup()).verifyComplete();

        verifyNoInteractions(repository, envManager);
        assertThat(commonConfig.getMcpInternalSecret()).isEqualTo("existing-secret");
    }

    @Test
    void mcpOffEverywhere_doesNotCreateSecret() {
        when(repository.retrieveAll())
                .thenReturn(Flux.just(organizationWithMcp(false), organizationWithMcp(null), new Organization()));

        StepVerifier.create(service.repairMcpInternalSecretOnStartup()).verifyComplete();

        verify(envManager, never()).persistMcpInternalSecret(anyString());
        verify(envManager, never()).restartMcpWithoutAclCheck();
        assertThat(commonConfig.getMcpInternalSecret()).isEmpty();
        assertThat(onFile.get()).isEmpty();
    }

    @Test
    void mcpOn_noEnvFile_doesNotHoldSecretInMemoryOnly() {
        commonConfig.setEnvFilePath("");
        when(repository.retrieveAll()).thenReturn(Flux.just(organizationWithMcp(true)));

        StepVerifier.create(service.repairMcpInternalSecretOnStartup()).verifyComplete();

        verify(envManager, never()).persistMcpInternalSecret(anyString());
        verify(envManager, never()).restartMcpWithoutAclCheck();
        assertThat(commonConfig.getMcpInternalSecret()).isEmpty();
    }

    @Test
    void mcpOnInOneOrganization_emptyEnvFile_writesSecretAndRestartsMcp() {
        when(repository.retrieveAll()).thenReturn(Flux.just(organizationWithMcp(false), organizationWithMcp(true)));

        StepVerifier.create(service.repairMcpInternalSecretOnStartup()).verifyComplete();

        assertThat(onFile.get()).isNotBlank();
        assertThat(commonConfig.getMcpInternalSecret()).isEqualTo(onFile.get());
        verify(envManager, times(1)).restartMcpWithoutAclCheck();
    }

    @Test
    void mcpOn_envFileAlreadyHasSecret_usesItWithoutWriting() {
        when(repository.retrieveAll()).thenReturn(Flux.just(organizationWithMcp(true)));
        when(envManager.getAllWithoutAclCheck()).thenReturn(Mono.just(Map.of(SECRET_KEY, "written-by-another-pod")));

        StepVerifier.create(service.repairMcpInternalSecretOnStartup()).verifyComplete();

        verify(envManager, never()).persistMcpInternalSecret(anyString());
        assertThat(commonConfig.getMcpInternalSecret()).isEqualTo("written-by-another-pod");
        verify(envManager, times(1)).restartMcpWithoutAclCheck();
    }

    @Test
    void mcpOn_writeFails_leavesBothProcessesWithoutSecret() {
        when(repository.retrieveAll()).thenReturn(Flux.just(organizationWithMcp(true)));
        // persistMcpInternalSecret swallows write errors, so a failed write shows up as an empty read-back.
        when(envManager.getAllWithoutAclCheck()).thenReturn(Mono.just(Map.of()));
        when(envManager.persistMcpInternalSecret(anyString())).thenReturn(Mono.empty());

        StepVerifier.create(service.repairMcpInternalSecretOnStartup()).verifyComplete();

        assertThat(commonConfig.getMcpInternalSecret()).isEmpty();
        verify(envManager, never()).restartMcpWithoutAclCheck();
    }

    @Test
    void mcpOn_envFileUnreadable_completesWithoutRestart() {
        when(repository.retrieveAll()).thenReturn(Flux.just(organizationWithMcp(true)));
        when(envManager.getAllWithoutAclCheck()).thenReturn(Mono.error(new IllegalStateException("no env file")));

        StepVerifier.create(service.repairMcpInternalSecretOnStartup()).verifyComplete();

        assertThat(commonConfig.getMcpInternalSecret()).isEmpty();
        verify(envManager, never()).restartMcpWithoutAclCheck();
    }

    @Test
    void organizationReadFails_completesWithoutRestart() {
        when(repository.retrieveAll()).thenReturn(Flux.error(new IllegalStateException("mongo down")));

        StepVerifier.create(service.repairMcpInternalSecretOnStartup()).verifyComplete();

        verify(envManager, never()).restartMcpWithoutAclCheck();
    }
}
