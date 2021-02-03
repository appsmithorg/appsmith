package com.appsmith.server.solutions;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.PluginService;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Set;

import static reactor.test.StepVerifier.create;
import static org.assertj.core.api.Assertions.assertThat;


@RunWith(SpringRunner.class)
@SpringBootTest
public class AuthenticationServiceTest {

    @Autowired
    AuthenticationService authenticationService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    PluginService pluginService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @Autowired
    OrganizationRepository organizationRepository;

    @Test
    public void testGetAuthorizationCodeURL_missingDatasource() {
        Mono<String> authorizationCodeUrlMono = authenticationService.getAuthorizationCodeURL("invalidId");

        create(authorizationCodeUrlMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                ((AppsmithException) throwable).getError().equals(AppsmithError.NO_RESOURCE_FOUND) &&
                                throwable.getMessage().equalsIgnoreCase("Unable to find resource with id invalidId"))
                .verify();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetAuthorizationCodeURL_invalidDatasource() {
        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        String orgId = testOrg == null ? "" : testOrg.getId();
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));


        // 1. Null authentication object
        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("Invalid OAuth2 datasource");
        datasource.setOrganizationId(orgId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create).cache();

        Mono<String> authorizationCodeUrlMono = datasourceMono.map(BaseDomain::getId)
                .flatMap(datasourceId -> authenticationService.getAuthorizationCodeURL(datasourceId));

        StepVerifier
                .create(authorizationCodeUrlMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                ((AppsmithException) throwable).getError().equals(AppsmithError.INVALID_PARAMETER) &&
                                throwable.getMessage().equalsIgnoreCase("Please enter a valid parameter authentication."))
                .verify();

        // 2. Without Client Id
        authorizationCodeUrlMono = datasourceMono
                .flatMap(datasource1 -> {
                    AuthenticationDTO authenticationDTO = new OAuth2();
                    datasource1.getDatasourceConfiguration().setAuthentication(authenticationDTO);
                    return Mono.just(datasource1);
                })
                .flatMap(datasource2 -> datasourceService.save(datasource2))
                .map(BaseDomain::getId)
                .flatMap(datasourceId -> authenticationService.getAuthorizationCodeURL(datasourceId));

        StepVerifier
                .create(authorizationCodeUrlMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                ((AppsmithException) throwable).getError().equals(AppsmithError.INVALID_PARAMETER) &&
                                throwable.getMessage().equalsIgnoreCase("Please enter a valid parameter clientId."))
                .verify();

        // 3. Without Client Secret
        authorizationCodeUrlMono = datasourceMono
                .flatMap(datasource1 -> {
                    OAuth2 authenticationDTO = new OAuth2();
                    authenticationDTO.setClientId("ClientId");
                    datasource1.getDatasourceConfiguration().setAuthentication(authenticationDTO);
                    return Mono.just(datasource1);
                })
                .flatMap(datasource2 -> datasourceService.save(datasource2))
                .map(BaseDomain::getId)
                .flatMap(datasourceId -> authenticationService.getAuthorizationCodeURL(datasourceId));

        StepVerifier
                .create(authorizationCodeUrlMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                ((AppsmithException) throwable).getError().equals(AppsmithError.INVALID_PARAMETER) &&
                                throwable.getMessage().equalsIgnoreCase("Please enter a valid parameter clientSecret."))
                .verify();

        // 4. Without Authorization URL
        authorizationCodeUrlMono = datasourceMono
                .flatMap(datasource1 -> {
                    OAuth2 authenticationDTO = new OAuth2();
                    authenticationDTO.setClientId("ClientId");
                    authenticationDTO.setClientSecret("ClientSecret");
                    datasource1.getDatasourceConfiguration().setAuthentication(authenticationDTO);
                    return Mono.just(datasource1);
                })
                .flatMap(datasource2 -> datasourceService.save(datasource2))
                .map(BaseDomain::getId)
                .flatMap(datasourceId -> authenticationService.getAuthorizationCodeURL(datasourceId));

        StepVerifier
                .create(authorizationCodeUrlMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                ((AppsmithException) throwable).getError().equals(AppsmithError.INVALID_PARAMETER) &&
                                throwable.getMessage().equalsIgnoreCase("Please enter a valid parameter authorizationUrl."))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetAuthorizationCodeURL_validDatasource() {
        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        String orgId = testOrg == null ? "" : testOrg.getId();
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));


        // 1. Null authentication object
        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("Valid datasource for OAuth2");
        datasource.setOrganizationId(orgId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        OAuth2 authenticationDTO = new OAuth2();
        authenticationDTO.setClientId("ClientId");
        authenticationDTO.setClientSecret("ClientSecret");
        authenticationDTO.setAuthorizationUrl("AuthorizationURL");
        authenticationDTO.setScope(Set.of("Scope1", "Scope2"));
        authenticationDTO.setCustomAuthenticationParameters(Set.of(new Property("key", "value")));
        datasourceConfiguration.setAuthentication(authenticationDTO);
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create).cache();
        
        final String datasourceId1 = datasourceMono.map(BaseDomain::getId).block();

        Mono<String> authorizationCodeUrlMono = datasourceMono.map(BaseDomain::getId)
                .flatMap(datasourceId -> authenticationService.getAuthorizationCodeURL(datasourceId));

        StepVerifier
                .create(authorizationCodeUrlMono)
                .assertNext(url -> {
                    assertThat(url)
                            .isEqualTo("AuthorizationURL?client_id=ClientId&response_type=code&redirect_uri=" +
                                    "https://app.appsmith.com/applications" +
                                    "&state=" + datasourceId1 + "&scope=Scope1,Scope2&key=value");
                })
                .verifyComplete();

    }

}
