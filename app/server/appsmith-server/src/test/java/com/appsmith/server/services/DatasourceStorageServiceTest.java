package com.appsmith.server.services;

import com.appsmith.external.models.ApiKeyAuth;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.BasicAuth;
import com.appsmith.external.models.BearerTokenAuth;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.KeyPairAuth;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.SSHConnection;
import com.appsmith.external.models.SSHPrivateKey;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.models.UploadedFile;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.solutions.ApplicationPermission;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Comparator;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Slf4j
public class DatasourceStorageServiceTest {

    private record CredentialPair(AuthenticationDTO stored, AuthenticationDTO request) {}

    @Autowired
    UserRepository userRepository;

    @SpyBean
    WorkspaceService workspaceService;

    @Autowired
    DatasourceStorageService datasourceStorageService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    PluginService pluginService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationPermission applicationPermission;

    Workspace workspace;

    @BeforeEach
    public void setup() {
        Mono<User> userMono = userRepository.findByEmail("api_user").cache();
        workspace = userMono.flatMap(user -> workspaceService.createDefault(new Workspace(), user))
                .switchIfEmpty(Mono.error(new Exception("createDefault is returning empty!!")))
                .block();
    }

    @AfterEach
    public void cleanup() {
        List<Application> deletedApplications = applicationPermission
                .getDeletePermission()
                .flatMapMany(permission -> applicationService.findByWorkspaceId(workspace.getId(), permission))
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace =
                workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyFindByDatasourceId() {

        String datasourceId = "mockDatasourceId";
        String environmentIdOne = "mockEnvironmentIdOne";
        String environmentIdTwo = "mockEnvironmentIdTwo";
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setEndpoints(List.of(new Endpoint("mockEndpoints", 000L)));
        DatasourceStorage datasourceStorageOne =
                new DatasourceStorage(datasourceId, environmentIdOne, datasourceConfiguration, null, null, null);

        DatasourceStorage datasourceStorageTwo =
                new DatasourceStorage(datasourceId, environmentIdTwo, datasourceConfiguration, null, null, null);

        datasourceStorageService.save(datasourceStorageOne).block();
        datasourceStorageService.save(datasourceStorageTwo).block();

        Flux<DatasourceStorage> datasourceStorageFlux = datasourceStorageService
                .findStrictlyByDatasourceId(datasourceId)
                .sort(Comparator.comparing(DatasourceStorage::getEnvironmentId));

        StepVerifier.create(datasourceStorageFlux)
                .assertNext(datasourceStorage -> {
                    assertThat(datasourceStorage).isNotNull();
                    assertThat(datasourceId).isEqualTo(datasourceStorage.getDatasourceId());
                    assertThat("mockEnvironmentIdOne").isEqualTo(datasourceStorage.getEnvironmentId());
                })
                .assertNext(datasourceStorage -> {
                    assertThat(datasourceStorage).isNotNull();
                    assertThat(datasourceId).isEqualTo(datasourceStorage.getDatasourceId());
                    assertThat("mockEnvironmentIdTwo").isEqualTo(datasourceStorage.getEnvironmentId());
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void changedConnectionRequiresFreshCredentialsForEveryEncryptedCredentialShape() {
        DBAuth storedDbAuth = new DBAuth();
        storedDbAuth.setUsername("db-user");
        storedDbAuth.setPassword("db-password");
        DBAuth requestDbAuth = new DBAuth();
        requestDbAuth.setUsername("db-user");

        BasicAuth storedBasicAuth = new BasicAuth("basic-user", "basic-password");
        BasicAuth requestBasicAuth = new BasicAuth("basic-user", null);
        BearerTokenAuth storedBearerAuth = new BearerTokenAuth("bearer-token");
        BearerTokenAuth requestBearerAuth = new BearerTokenAuth(null);

        ApiKeyAuth storedApiKeyAuth = new ApiKeyAuth();
        storedApiKeyAuth.setAddTo(ApiKeyAuth.Type.HEADER);
        storedApiKeyAuth.setLabel("X-API-Key");
        storedApiKeyAuth.setValue("api-key");
        ApiKeyAuth requestApiKeyAuth = new ApiKeyAuth();
        requestApiKeyAuth.setAddTo(ApiKeyAuth.Type.HEADER);
        requestApiKeyAuth.setLabel("X-API-Key");

        OAuth2 storedOAuth = new OAuth2();
        storedOAuth.setClientId("client-id");
        storedOAuth.setClientSecret("client-secret");
        OAuth2 requestOAuth = new OAuth2();
        requestOAuth.setClientId("client-id");

        KeyPairAuth storedKeyPair = new KeyPairAuth();
        storedKeyPair.setUsername("key-user");
        storedKeyPair.setPrivateKey(new UploadedFile("private-key.pem", "cHJpdmF0ZS1rZXk="));
        storedKeyPair.setPassphrase("key-passphrase");
        KeyPairAuth requestKeyPair = new KeyPairAuth();
        requestKeyPair.setUsername("key-user");
        requestKeyPair.setPrivateKey(new UploadedFile("private-key.pem", null));

        OAuth2 storedOAuthToken = new OAuth2();
        storedOAuthToken.setClientId("token-client-id");
        AuthenticationResponse authenticationResponse = new AuthenticationResponse();
        authenticationResponse.setToken("access-token");
        authenticationResponse.setRefreshToken("refresh-token");
        storedOAuthToken.setAuthenticationResponse(authenticationResponse);
        OAuth2 requestOAuthToken = new OAuth2();
        requestOAuthToken.setClientId("token-client-id");

        List<CredentialPair> authenticationCases = List.of(
                new CredentialPair(storedDbAuth, requestDbAuth),
                new CredentialPair(storedBasicAuth, requestBasicAuth),
                new CredentialPair(storedBearerAuth, requestBearerAuth),
                new CredentialPair(storedApiKeyAuth, requestApiKeyAuth),
                new CredentialPair(storedOAuth, requestOAuth),
                new CredentialPair(storedKeyPair, requestKeyPair),
                new CredentialPair(storedOAuthToken, requestOAuthToken));

        authenticationCases.forEach(credentialPair -> assertChangedConnectionRequiresCredentials(
                configurationWithAuthentication("trusted.example.com", credentialPair.stored()),
                configurationWithAuthentication("changed.example.com", credentialPair.request())));

        DatasourceConfiguration storedTlsConfiguration = new DatasourceConfiguration();
        storedTlsConfiguration.setEndpoints(List.of(new Endpoint("trusted.example.com", 5432L)));
        Connection storedConnection = new Connection();
        SSLDetails storedSsl = new SSLDetails();
        storedSsl.setAuthType(SSLDetails.AuthType.VERIFY_FULL);
        storedSsl.setKeyFile(new UploadedFile("client-key.pem", "Y2xpZW50LWtleQ=="));
        storedConnection.setSsl(storedSsl);
        storedTlsConfiguration.setConnection(storedConnection);

        DatasourceConfiguration requestTlsConfiguration = new DatasourceConfiguration();
        requestTlsConfiguration.setEndpoints(List.of(new Endpoint("changed.example.com", 5432L)));
        Connection requestConnection = new Connection();
        SSLDetails requestSsl = new SSLDetails();
        requestSsl.setAuthType(SSLDetails.AuthType.VERIFY_FULL);
        requestSsl.setKeyFile(new UploadedFile("client-key.pem", null));
        requestConnection.setSsl(requestSsl);
        requestTlsConfiguration.setConnection(requestConnection);
        assertChangedConnectionRequiresCredentials(storedTlsConfiguration, requestTlsConfiguration);

        DatasourceConfiguration storedSshConfiguration = new DatasourceConfiguration();
        storedSshConfiguration.setEndpoints(List.of(new Endpoint("trusted.example.com", 5432L)));
        SSHConnection storedSsh = new SSHConnection();
        storedSsh.setHost("bastion.example.com");
        storedSsh.setPort(22L);
        storedSsh.setUsername("ssh-user");
        storedSsh.setPrivateKey(new SSHPrivateKey(null, "ssh-password"));
        storedSshConfiguration.setSshProxy(storedSsh);

        DatasourceConfiguration requestSshConfiguration = new DatasourceConfiguration();
        requestSshConfiguration.setEndpoints(List.of(new Endpoint("changed.example.com", 5432L)));
        SSHConnection requestSsh = new SSHConnection();
        requestSsh.setHost("bastion.example.com");
        requestSsh.setPort(22L);
        requestSsh.setUsername("ssh-user");
        requestSsh.setPrivateKey(new SSHPrivateKey(null, null));
        requestSshConfiguration.setSshProxy(requestSsh);
        assertChangedConnectionRequiresCredentials(storedSshConfiguration, requestSshConfiguration);
    }

    private DatasourceConfiguration configurationWithAuthentication(String host, AuthenticationDTO authentication) {
        DatasourceConfiguration configuration = new DatasourceConfiguration();
        configuration.setEndpoints(List.of(new Endpoint(host, 5432L)));
        configuration.setAuthentication(authentication);
        return configuration;
    }

    private void assertChangedConnectionRequiresCredentials(
            DatasourceConfiguration storedConfiguration, DatasourceConfiguration requestConfiguration) {
        DatasourceStorage storedStorage =
                new DatasourceStorage("datasource-id", "environment-id", storedConfiguration, null, null, null);
        storedStorage.setId("storage-id");
        DatasourceStorage requestStorage =
                new DatasourceStorage("datasource-id", "environment-id", requestConfiguration, null, null, null);
        requestStorage.setId("storage-id");

        assertThatThrownBy(() -> datasourceStorageService.bindStoredCredentials(requestStorage, storedStorage))
                .isInstanceOf(AppsmithException.class)
                .extracting(error -> ((AppsmithException) error).getError())
                .isEqualTo(AppsmithError.DATASOURCE_CREDENTIALS_REQUIRED);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyStorageCreationErrorsOutWhenStorageAlreadyExists() {

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint("https://sample.endpoint", 5432L);
        DBAuth dbAuth = new DBAuth();
        dbAuth.setPassword("password");
        dbAuth.setUsername("username");
        dbAuth.setDatabaseName("databaseName");

        datasourceConfiguration.setEndpoints(List.of(endpoint));
        datasourceConfiguration.setAuthentication(dbAuth);

        Plugin plugin = pluginService.findByPackageName("postgres-plugin").block();
        String pluginId = plugin.getId();
        String datasourceId = "mockedDatasourceId";
        String environmentIdOne = "mockedEnvironmentId";

        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId(datasourceId);
        datasourceStorage.setEnvironmentId(environmentIdOne);
        datasourceStorage.setPluginId(pluginId);
        datasourceStorage.setDatasourceConfiguration(datasourceConfiguration);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        datasourceStorageService.create(datasourceStorage).block();
        StepVerifier.create(datasourceStorageService.create(datasourceStorage)).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getAppErrorCode())
                    .isEqualTo(AppsmithError.DUPLICATE_DATASOURCE_CONFIGURATION.getAppErrorCode());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyStorageCreationSucceedsWithDifferentEnvironmentId() {

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint("https://sample.endpoint", 5432L);
        DBAuth dbAuth = new DBAuth();
        dbAuth.setPassword("password");
        dbAuth.setUsername("username");
        dbAuth.setDatabaseName("databaseName");

        datasourceConfiguration.setEndpoints(List.of(endpoint));
        datasourceConfiguration.setAuthentication(dbAuth);

        Plugin plugin = pluginService.findByPackageName("postgres-plugin").block();
        String pluginId = plugin.getId();
        String datasourceId = "sampleDatasourceId";
        String environmentIdOne = "sampleEnvironmentId";

        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId(datasourceId);
        datasourceStorage.setEnvironmentId(environmentIdOne);
        datasourceStorage.setPluginId(pluginId);
        datasourceStorage.setDatasourceConfiguration(datasourceConfiguration);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        datasourceStorageService.create(datasourceStorage).block();

        String environmentId = "sampleEnvironmentId2";
        datasourceStorage.setEnvironmentId(environmentId);
        StepVerifier.create(datasourceStorageService.create(datasourceStorage)).assertNext(dbDatasourceStorage -> {
            assertThat(dbDatasourceStorage).isNotNull();
            assertThat(datasourceId).isEqualTo(dbDatasourceStorage.getDatasourceId());
            assertThat(environmentId).isEqualTo(dbDatasourceStorage.getEnvironmentId());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyFindByDatasourceAndStorageIdGivesErrorWhenNoConfigurationIsPresent() {

        Plugin plugin = pluginService.findByPackageName("postgres-plugin").block();
        String pluginId = plugin.getId();
        String datasourceId = "datasourceForExecution";
        String environmentIdOne = FieldName.UNUSED_ENVIRONMENT_ID;

        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId(datasourceId);
        datasourceStorage.setEnvironmentId(environmentIdOne);
        datasourceStorage.setPluginId(pluginId);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        datasourceStorageService.create(datasourceStorage).block();

        Datasource datasource = new Datasource();
        datasource.setId(datasourceId);
        datasource.setPluginId(pluginId);

        Mono<DatasourceStorage> datasourceStorageMono =
                datasourceStorageService.findByDatasourceAndEnvironmentIdForExecution(datasource, environmentIdOne);
        StepVerifier.create(datasourceStorageMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getAppErrorCode())
                    .isEqualTo(AppsmithError.NO_CONFIGURATION_FOUND_IN_DATASOURCE.getAppErrorCode());
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyFindByDatasourceAndStorageIdGivesErrorWhenStorageIsAbsent() {
        String datasourceId = "datasourceForUnsavedStorage";
        String environmentIdOne = FieldName.UNUSED_ENVIRONMENT_ID;

        Datasource datasource = new Datasource();
        datasource.setId(datasourceId);

        Mono<DatasourceStorage> datasourceStorageMono =
                datasourceStorageService.findByDatasourceAndEnvironmentIdForExecution(datasource, environmentIdOne);
        StepVerifier.create(datasourceStorageMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(AppsmithException.class);
            assertThat(((AppsmithException) error).getAppErrorCode())
                    .isEqualTo(AppsmithError.NO_RESOURCE_FOUND.getAppErrorCode());
        });
    }
}
