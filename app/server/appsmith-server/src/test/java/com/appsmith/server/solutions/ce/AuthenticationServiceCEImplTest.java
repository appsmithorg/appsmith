package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.Connection;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.external.models.UploadedFile;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.AuthorizationCodeCallbackDTO;
import com.appsmith.server.helpers.InstanceConfigHelper;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import mockwebserver3.MockResponse;
import mockwebserver3.MockWebServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyStore;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceCEImplTest {

    private static final String KEY_STORE_PASSWORD = "changeit";
    private static final String DATASOURCE_ID = "datasource-id";
    private static final String ENVIRONMENT_ID = "environment-id";
    private static final String PAGE_ID = "page-id";
    private static final String STATE =
            String.join(",", PAGE_ID, DATASOURCE_ID, ENVIRONMENT_ID, "https://app.example.com", "workspace-id");

    @TempDir
    static Path tlsDirectory;

    private static SSLSocketFactory tokenServerSocketFactory;
    private static UploadedFile tokenServerCertificate;
    private static UploadedFile unrelatedCertificate;

    @Mock
    private DatasourceService datasourceService;

    @Mock
    private PluginService pluginService;

    @Mock
    private RedirectHelper redirectHelper;

    @Mock
    private NewPageService newPageService;

    @Mock
    private CloudServicesConfig cloudServicesConfig;

    @Mock
    private ConfigService configService;

    @Mock
    private DatasourcePermission datasourcePermission;

    @Mock
    private PagePermission pagePermission;

    @Mock
    private PluginExecutorHelper pluginExecutorHelper;

    @Mock
    private DatasourceStorageService datasourceStorageService;

    @Mock
    private InstanceConfigHelper instanceConfigHelper;

    @InjectMocks
    private AuthenticationServiceCEImpl authenticationService;

    private MockWebServer tokenServer;

    @BeforeAll
    static void generateCertificates() throws Exception {
        KeyStore tokenServerIdentity = generateSelfSignedIdentity("token-server");
        tokenServerSocketFactory = serverSocketFactory(tokenServerIdentity);
        tokenServerCertificate = uploadedCertificate(tokenServerIdentity, "token-server");
        unrelatedCertificate = uploadedCertificate(generateSelfSignedIdentity("unrelated"), "unrelated");
    }

    @BeforeEach
    void startTokenServer() throws Exception {
        tokenServer = new MockWebServer();
        tokenServer.useHttps(tokenServerSocketFactory, false);
        tokenServer.start();
    }

    @AfterEach
    void stopTokenServer() throws Exception {
        tokenServer.close();
    }

    @Test
    void should_storeAccessToken_when_tokenServerCertificateIsTrustedThroughDatasource() {
        // Given
        tokenServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .addHeader("Content-Type", "application/json")
                .setBody("{\"access_token\":\"issued-token\"}"));
        DatasourceStorage datasourceStorage = givenDatasourceStorage(true, tokenServerCertificate);
        when(datasourceStorageService.save(datasourceStorage)).thenReturn(Mono.just(datasourceStorage));

        // When
        Mono<String> redirectUrl = authenticationService.getAccessTokenForGenericOAuth2(authorizationCodeCallback());

        // Then
        StepVerifier.create(redirectUrl)
                .assertNext(url -> assertThat(url).contains("response_status=success"))
                .verifyComplete();
        OAuth2 oAuth2 = (OAuth2) datasourceStorage.getDatasourceConfiguration().getAuthentication();
        assertThat(oAuth2.getAuthenticationResponse().getToken()).isEqualTo("issued-token");
        assertThat(tokenServer.getRequestCount()).isEqualTo(1);
    }

    /**
     * The token server's certificate is self-signed, so default trust rejects it. These cases show that only the
     * datasource setting together with the server's own certificate lets the exchange through.
     */
    @ParameterizedTest(name = "useSelfSignedCert={0}, uploads token server certificate={1}")
    @CsvSource({"false, true", "true, false"})
    void should_redirectWithError_when_tokenServerCertificateIsNotTrustedThroughDatasource(
            boolean useSelfSignedCert, boolean uploadsTokenServerCertificate) {
        // Given
        UploadedFile certificate = uploadsTokenServerCertificate ? tokenServerCertificate : unrelatedCertificate;
        givenDatasourceStorage(useSelfSignedCert, certificate);

        // When
        Mono<String> redirectUrl = authenticationService.getAccessTokenForGenericOAuth2(authorizationCodeCallback());

        // Then
        StepVerifier.create(redirectUrl)
                .assertNext(url -> assertThat(url).contains("response_status=appsmith_error"))
                .verifyComplete();
        verify(datasourceStorageService, never()).save(any());
        assertThat(tokenServer.getRequestCount()).isZero();
    }

    private DatasourceStorage givenDatasourceStorage(boolean useSelfSignedCert, UploadedFile certificate) {
        OAuth2 oAuth2 = new OAuth2();
        oAuth2.setGrantType(OAuth2.Type.AUTHORIZATION_CODE);
        oAuth2.setAccessTokenUrl(tokenServer.url("/oauth/token").toString());
        oAuth2.setClientId("client-id");
        oAuth2.setClientSecret("client-secret");
        oAuth2.setUseSelfSignedCert(useSelfSignedCert);

        SSLDetails ssl = new SSLDetails();
        ssl.setAuthType(SSLDetails.AuthType.SELF_SIGNED_CERTIFICATE);
        ssl.setCertificateFile(certificate);
        Connection connection = new Connection();
        connection.setSsl(ssl);

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(oAuth2);
        datasourceConfiguration.setConnection(connection);

        Datasource datasource = new Datasource();
        datasource.setId(DATASOURCE_ID);
        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId(DATASOURCE_ID);
        datasourceStorage.setEnvironmentId(ENVIRONMENT_ID);
        datasourceStorage.setDatasourceConfiguration(datasourceConfiguration);

        NewPage page = new NewPage();
        page.setId(PAGE_ID);
        page.setApplicationId("application-id");

        when(datasourcePermission.getEditPermission()).thenReturn(AclPermission.MANAGE_DATASOURCES);
        when(datasourceService.findById(DATASOURCE_ID, AclPermission.MANAGE_DATASOURCES))
                .thenReturn(Mono.just(datasource));
        when(datasourceStorageService.findByDatasourceAndEnvironmentId(datasource, ENVIRONMENT_ID))
                .thenReturn(Mono.just(datasourceStorage));
        when(pagePermission.getReadPermission()).thenReturn(AclPermission.READ_PAGES);
        when(newPageService.findById(PAGE_ID, AclPermission.READ_PAGES)).thenReturn(Mono.just(page));
        return datasourceStorage;
    }

    private static AuthorizationCodeCallbackDTO authorizationCodeCallback() {
        AuthorizationCodeCallbackDTO callback = new AuthorizationCodeCallbackDTO();
        callback.setCode("authorization-code");
        callback.setState(STATE);
        return callback;
    }

    private static KeyStore generateSelfSignedIdentity(String alias) throws Exception {
        Path keyStoreFile = tlsDirectory.resolve(alias + ".p12");
        String keytool =
                Path.of(System.getProperty("java.home"), "bin", "keytool").toString();
        Process process = new ProcessBuilder(List.of(
                        keytool,
                        "-genkeypair",
                        "-alias",
                        alias,
                        "-keyalg",
                        "RSA",
                        "-keysize",
                        "2048",
                        "-validity",
                        "2",
                        "-dname",
                        "CN=localhost",
                        "-ext",
                        "SAN=dns:localhost,ip:127.0.0.1",
                        "-keystore",
                        keyStoreFile.toString(),
                        "-storetype",
                        "PKCS12",
                        "-storepass",
                        KEY_STORE_PASSWORD,
                        "-keypass",
                        KEY_STORE_PASSWORD))
                .redirectErrorStream(true)
                .start();
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (!process.waitFor(60, TimeUnit.SECONDS) || process.exitValue() != 0) {
            throw new IllegalStateException("keytool failed: " + output);
        }

        KeyStore keyStore = KeyStore.getInstance("PKCS12");
        try (InputStream in = Files.newInputStream(keyStoreFile)) {
            keyStore.load(in, KEY_STORE_PASSWORD.toCharArray());
        }
        return keyStore;
    }

    private static SSLSocketFactory serverSocketFactory(KeyStore identity) throws Exception {
        KeyManagerFactory keyManagers = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        keyManagers.init(identity, KEY_STORE_PASSWORD.toCharArray());
        SSLContext context = SSLContext.getInstance("TLS");
        context.init(keyManagers.getKeyManagers(), null, null);
        return context.getSocketFactory();
    }

    /** Encodes the certificate the way the datasource form uploads it: a PEM file as a base64 data URL. */
    private static UploadedFile uploadedCertificate(KeyStore identity, String alias) throws Exception {
        String pem = "-----BEGIN CERTIFICATE-----\n"
                + Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.US_ASCII))
                        .encodeToString(identity.getCertificate(alias).getEncoded())
                + "\n-----END CERTIFICATE-----\n";
        UploadedFile file = new UploadedFile();
        file.setName(alias + ".pem");
        file.setBase64Content("data:application/x-x509-ca-cert;base64,"
                + Base64.getEncoder().encodeToString(pem.getBytes(StandardCharsets.US_ASCII)));
        return file;
    }
}
