package com.appsmith.server.solutions;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.external.models.Datasource;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.OrganizationRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.PluginService;
import com.appsmith.server.services.UserService;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.util.LinkedMultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

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

    @Autowired
    UserService userService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetAuthorizationCodeURL_missingDatasource() {
        Mono<String> authorizationCodeUrlMono = authenticationService
                .getAuthorizationCodeURLForGenericOauth2("invalidId", "irrelevantPageId", null);

        StepVerifier
                .create(authorizationCodeUrlMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                ((AppsmithException) throwable).getError().equals(AppsmithError.NO_RESOURCE_FOUND) &&
                                throwable.getMessage().equalsIgnoreCase("Unable to find datasource invalidId"))
                .verify();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testGetAuthorizationCodeURL_invalidDatasourceWithNullAuthentication() {
        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        String orgId = testOrg == null ? "" : testOrg.getId();
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        Mono<Plugin> pluginMono = pluginService.findByName("Installed Plugin Name");
        Datasource datasource = new Datasource();
        datasource.setName("Missing OAuth2 datasource");
        datasource.setOrganizationId(orgId);
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("http://test.com");
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create).cache();

        Mono<String> authorizationCodeUrlMono = datasourceMono.map(BaseDomain::getId)
                .flatMap(datasourceId -> authenticationService.getAuthorizationCodeURLForGenericOauth2(datasourceId, "irrelevantPageId", null));

        StepVerifier
                .create(authorizationCodeUrlMono)
                .expectErrorMatches(throwable ->
                        throwable instanceof AppsmithException &&
                                ((AppsmithException) throwable).getError().equals(AppsmithError.INVALID_PARAMETER) &&
                                throwable.getMessage().equalsIgnoreCase("Please enter a valid parameter authentication."))
                .verify();
    }


    @Test
    @WithUserDetails(value = "api_user")
    public void testGetAuthorizationCodeURL_validDatasource() {
        LinkedMultiValueMap<String, String> mockHeaders = new LinkedMultiValueMap<>(1);
        mockHeaders.add(HttpHeaders.REFERER, "https://mock.origin.com/source/uri");

        MockServerHttpRequest httpRequest = MockServerHttpRequest.get("").headers(mockHeaders).build();

        Organization testOrg = organizationRepository.findByName("Another Test Organization", AclPermission.READ_ORGANIZATIONS).block();
        String orgId = testOrg == null ? "" : testOrg.getId();
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PageDTO testPage = new PageDTO();
        testPage.setName("PageServiceTest TestApp");
        User apiUser = userService.findByEmail("api_user").block();
        orgId = apiUser.getOrganizationIds().iterator().next();

        Application newApp = new Application();
        newApp.setName(UUID.randomUUID().toString());
        Application application = applicationPageService.createApplication(newApp, orgId).block();

        testPage.setApplicationId(application.getId());

        PageDTO pageDto = applicationPageService.createPage(testPage).block();

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
        authenticationDTO.setAccessTokenUrl("AccessTokenURL");
        authenticationDTO.setScope(Set.of("Scope1", "Scope2"));
        authenticationDTO.setCustomAuthenticationParameters(Set.of(new Property("key", "value")));
        datasourceConfiguration.setAuthentication(authenticationDTO);
        datasource.setDatasourceConfiguration(datasourceConfiguration);
        Mono<Datasource> datasourceMono = pluginMono.map(plugin -> {
            datasource.setPluginId(plugin.getId());
            return datasource;
        }).flatMap(datasourceService::create).cache();

        final String datasourceId1 = datasourceMono.map(BaseDomain::getId).block();

        Mono<String> authorizationCodeUrlMono = authenticationService.getAuthorizationCodeURLForGenericOauth2(datasourceId1, pageDto.getId(), httpRequest);

        StepVerifier
                .create(authorizationCodeUrlMono)
                .assertNext(url -> {
                    assertThat(url).matches(Pattern.compile("AuthorizationURL" +
                            "\\?client_id=ClientId" +
                            "&response_type=code" +
                            "&redirect_uri=https://mock.origin.com/api/v1/datasources/authorize" +
                            "&state=" + String.join(",", pageDto.getId(), datasourceId1, "https://mock.origin.com") +
                            "&scope=Scope\\d%20Scope\\d" +
                            "&key=value"));
                })
                .verifyComplete();
    }
}
