package com.appsmith.server.services;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Property;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.PluginExecutorHelper;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.pf4j.PluginManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class CurlImporterServiceTest {
    @Autowired
    CurlImporterService curlImporterService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    PluginManager pluginManager;

    @MockBean
    PluginExecutor<Object> pluginExecutor;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    UserService userService;

    String orgId;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Mockito.when(this.pluginManager.getExtensions(Mockito.any(), Mockito.anyString()))
                .thenReturn(List.of(this.pluginExecutor));

        User apiUser = userService.findByEmail("api_user").block();
        orgId = apiUser.getOrganizationIds().iterator().next();
    }

    @Test
    public void lexerTests() {
        assertThat(curlImporterService.lex("curl http://httpbin.org/get"))
                .isEqualTo(List.of("curl", "http://httpbin.org/get"));
        assertThat(curlImporterService.lex("curl -H 'X-Something: something else' http://httpbin.org/get"))
                .isEqualTo(List.of("curl", "-H", "X-Something: something else", "http://httpbin.org/get"));
        assertThat(curlImporterService.lex("curl -H \"X-Something: something else\" http://httpbin.org/get"))
                .isEqualTo(List.of("curl", "-H", "X-Something: something else", "http://httpbin.org/get"));
        assertThat(curlImporterService.lex("curl -H X-Something:\\ something\\ else http://httpbin.org/get"))
                .isEqualTo(List.of("curl", "-H", "X-Something: something else", "http://httpbin.org/get"));

        assertThat(curlImporterService.lex("curl -H \"X-Something: something \\\"quoted\\\" else\" http://httpbin.org/get"))
                .isEqualTo(List.of("curl", "-H", "X-Something: something \"quoted\" else", "http://httpbin.org/get"));
        assertThat(curlImporterService.lex("curl -H \"X-Something: something \\\\\\\"quoted\\\" else\" http://httpbin.org/get"))
                .isEqualTo(List.of("curl", "-H", "X-Something: something \\\"quoted\" else", "http://httpbin.org/get"));
    }

    @Test
    public void lexComments() {
        assertThat(curlImporterService.lex("curl some args # comment here"))
                .isEqualTo(List.of("curl", "some", "args"));
        assertThat(curlImporterService.lex("curl some args \\# comment here"))
                .isEqualTo(List.of("curl", "some", "args", "#", "comment", "here"));
        assertThat(curlImporterService.lex("curl some args '#' comment here"))
                .isEqualTo(List.of("curl", "some", "args", "#", "comment", "here"));
        assertThat(curlImporterService.lex("curl some args \"#\" comment here"))
                .isEqualTo(List.of("curl", "some", "args", "#", "comment", "here"));
    }

    @Test
    public void lexWhiteSpace() {
        assertThat(curlImporterService.lex("curl 'some args    with lots of   space'"))
                .isEqualTo(List.of("curl", "some args    with lots of   space"));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testImportAction_EmptyLex() {
        // Set up the application & page for which this import curl action would be added
        Application app = new Application();
        app.setName("curlTest Incorrect Command");

        Application application = applicationPageService.createApplication(app, orgId).block();
        assert application != null;
        PageDTO page = newPageService.findPageById(application.getPages().get(0).getId(), AclPermission.MANAGE_PAGES, false).block();

        assert page != null;
        Mono<ActionDTO> action = curlImporterService.importAction("'", page.getId(), "actionName", orgId, null);

        StepVerifier
                .create(action)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                        throwable.getMessage().equals(AppsmithError.INVALID_CURL_COMMAND.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importValidCurlCommand() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(pluginExecutor));
        Mockito.when(pluginExecutor.getHintMessages(Mockito.any(), Mockito.any()))
                .thenReturn(Mono.zip(Mono.just(new HashSet<>()), Mono.just(new HashSet<>())));

        // Set up the application & page for which this import curl action would be added
        Application app = new Application();
        app.setName("curlTest App");

        Mono<Application> applicationMono = applicationPageService.createApplication(app, orgId)
                .flatMap(application1 -> {
                    String pageId = application1.getPages().get(0).getId();
                    return newPageService.findById(pageId, AclPermission.MANAGE_PAGES)
                            .flatMap(newPage -> {
                                newPage.getDefaultResources().setBranchName("main");
                                return newPageService.update(pageId, newPage);
                            })
                            .thenReturn(application1);
                }).cache();

        Mono<NewPage> defaultPageMono = applicationMono
                .flatMap(application -> newPageService.findById(application.getPages().get(0).getId(), AclPermission.MANAGE_PAGES))
                .cache();

        String command = "curl -X GET http://localhost:8080/api/v1/actions?name=something -H 'Accept: */*' -H 'Accept-Encoding: gzip, deflate' -H 'Authorization: Basic YXBpX3VzZXI6OHVBQDsmbUI6Y252Tn57Iw==' -H 'Cache-Control: no-cache' -H 'Connection: keep-alive' -H 'Content-Type: application/json' -H 'Cookie: SESSION=97c5def4-4f72-45aa-96fe-e8a9f5ade0b5,SESSION=97c5def4-4f72-45aa-96fe-e8a9f5ade0b5; SESSION=' -H 'Host: localhost:8080' -H 'Postman-Token: 16e4b6bc-2c7a-4ab1-a127-bca382dfc0f0,a6655daa-db07-4c5e-aca3-3fd505bd230d' -H 'User-Agent: PostmanRuntime/7.20.1' -H 'cache-control: no-cache' -d '{someJson}'";

        Mono<ActionDTO> resultMono = defaultPageMono
                .flatMap(page -> curlImporterService.importAction(command, page.getId(), "actionName", orgId, "main"))
                .cache();

        Mono<NewAction> savedActionMono = resultMono.flatMap(actionDTO -> newActionService.getById(actionDTO.getId()));

        StepVerifier
                .create(Mono.zip(resultMono, defaultPageMono, savedActionMono))
                .assertNext(tuple -> {
                    ActionDTO action1 = tuple.getT1();
                    NewPage newPage = tuple.getT2();
                    NewAction newAction = tuple.getT3();

                    assertThat(action1).isNotNull();
                    assertThat(action1.getDatasource()).isNotNull();
                    assertThat(action1.getDatasource().getDatasourceConfiguration()).isNotNull();
                    assertThat(action1.getDatasource().getDatasourceConfiguration().getUrl()).isEqualTo("http://localhost:8080");
                    assertThat(action1.getActionConfiguration().getPath()).isEqualTo("/api/v1/actions");
                    assertThat(action1.getActionConfiguration().getHeaders().size()).isEqualTo(11);
                    assertThat(action1.getActionConfiguration().getQueryParameters().size()).isEqualTo(1);
                    assertThat(action1.getActionConfiguration().getHttpMethod()).isEqualTo(HttpMethod.GET);
                    assertThat(action1.getActionConfiguration().getBody()).isEqualTo("{someJson}");

                    assertThat(newAction.getDefaultResources().getActionId()).isEqualTo(newAction.getId());
                    assertThat(action1.getDefaultResources().getPageId()).isEqualTo(newPage.getDefaultResources().getPageId());
                    assertThat(newAction.getDefaultResources().getBranchName()).isNotEmpty();
                    assertThat(newAction.getDefaultResources().getBranchName()).isEqualTo(newPage.getDefaultResources().getBranchName());
                    assertThat(newAction.getDefaultResources().getApplicationId()).isEqualTo(newPage.getDefaultResources().getApplicationId());
                })
                .verifyComplete();


        Application branchedApplication = new Application();
        branchedApplication.setName("branched curl test app");
        branchedApplication.setOrganizationId(orgId);
        branchedApplication = applicationPageService.createApplication(branchedApplication).block();
        String branchedPageId = branchedApplication.getPages().get(0).getId();

        Mono<NewPage> branchedPageMono = defaultPageMono
                .flatMap(defaultPage ->
                    newPageService.findById(branchedPageId, AclPermission.MANAGE_PAGES)
                            .flatMap(newPage -> {
                                newPage.setDefaultResources(defaultPage.getDefaultResources());
                                newPage.getDefaultResources().setBranchName("testBranch");
                                return newPageService.save(newPage);
                            })
                )
                .cache();

        Mono<ActionDTO> branchedResultMono = branchedPageMono
                .flatMap(page -> curlImporterService.importAction(command, page.getDefaultResources().getPageId(), "actionName", orgId, "testBranch"))
                .cache();

        // As importAction updates the ids with the defaultIds before sending the response to client we have to again
        // fetch branched action
        Mono<NewAction> branchedSavedActionMono = branchedResultMono
                .flatMap(actionDTO -> newActionService.findByBranchNameAndDefaultActionId("testBranch", actionDTO.getId(), AclPermission.MANAGE_ACTIONS));

        StepVerifier
                .create(Mono.zip(branchedResultMono, branchedPageMono, branchedSavedActionMono))
                .assertNext(tuple -> {
                    ActionDTO action1 = tuple.getT1();
                    NewPage newPage = tuple.getT2();
                    NewAction newAction = tuple.getT3();

                    assertThat(action1).isNotNull();
                    assertThat(action1.getDatasource()).isNotNull();
                    assertThat(action1.getDatasource().getDatasourceConfiguration()).isNotNull();
                    assertThat(action1.getDatasource().getDatasourceConfiguration().getUrl()).isEqualTo("http://localhost:8080");
                    assertThat(action1.getActionConfiguration().getPath()).isEqualTo("/api/v1/actions");
                    assertThat(action1.getActionConfiguration().getHeaders().size()).isEqualTo(11);
                    assertThat(action1.getActionConfiguration().getQueryParameters().size()).isEqualTo(1);
                    assertThat(action1.getActionConfiguration().getHttpMethod()).isEqualTo(HttpMethod.GET);
                    assertThat(action1.getActionConfiguration().getBody()).isEqualTo("{someJson}");

                    assertThat(newAction.getDefaultResources().getActionId()).isEqualTo(newAction.getId());
                    assertThat(action1.getDefaultResources().getPageId()).isEqualTo(newPage.getDefaultResources().getPageId());
                    assertThat(action1.getDefaultResources().getPageId()).isNotEqualTo(newPage.getId());

                    assertThat(newAction.getDefaultResources().getBranchName()).isNotEmpty();
                    assertThat(newAction.getDefaultResources().getBranchName()).isEqualTo("testBranch");
                    assertThat(newAction.getDefaultResources().getApplicationId()).isEqualTo(newPage.getDefaultResources().getApplicationId());
                })
                .verifyComplete();

    }

    @Test
    public void urlInSingleQuotes() throws AppsmithException {
        String command = "curl --location --request POST 'http://localhost:8080/scrap/api?slugifiedName=Freshdesk&ownerName=volodimir.kudriachenko'";
        ActionDTO action = curlImporterService.curlToAction(command);

        assertThat(action).isNotNull();
        assertThat(action.getDatasource()).isNotNull();
        assertThat(action.getDatasource().getDatasourceConfiguration()).isNotNull();
        assertUrl(action, "http://localhost:8080");

        final ActionConfiguration actionConfiguration = action.getActionConfiguration();
        assertThat(actionConfiguration.getPath()).isEqualTo("/scrap/api");
        assertThat(actionConfiguration.getHeaders()).isNullOrEmpty();
        assertThat(actionConfiguration.getQueryParameters().size()).isEqualTo(2);
        assertThat(actionConfiguration.getHttpMethod()).isEqualTo(HttpMethod.POST);
        assertThat(actionConfiguration.getBody()).isNullOrEmpty();
    }

    @Test
    public void missingMethod() throws AppsmithException {
        String command = "curl http://localhost:8080/scrap/api";
        ActionDTO action = curlImporterService.curlToAction(command);

        assertThat(action).isNotNull();
        assertThat(action.getDatasource()).isNotNull();
        assertThat(action.getDatasource().getDatasourceConfiguration()).isNotNull();
        assertUrl(action, "http://localhost:8080");

        final ActionConfiguration actionConfiguration = action.getActionConfiguration();
        assertThat(actionConfiguration.getPath()).isEqualTo("/scrap/api");
        assertThat(actionConfiguration.getHeaders()).isNullOrEmpty();
        assertThat(actionConfiguration.getQueryParameters()).isNullOrEmpty();
        assertThat(actionConfiguration.getHttpMethod()).isEqualTo(HttpMethod.GET);
        assertThat(actionConfiguration.getBody()).isNullOrEmpty();
    }

    @Test
    public void multilineCommand() throws AppsmithException {
        String command = "curl -d '{\"message\": \"The force is strong with this one...\"}' \\\n" +
                "  -H \"Content-Type: application/json\" \\\n" +
                "  \"http://piper.net\"";

        ActionDTO action = curlImporterService.curlToAction(command);

        assertThat(action).isNotNull();
        assertThat(action.getDatasource()).isNotNull();
        assertThat(action.getDatasource().getDatasourceConfiguration()).isNotNull();
        assertUrl(action, "http://piper.net");

        final ActionConfiguration actionConfiguration = action.getActionConfiguration();
        assertEmptyPath(action);
        assertHeaders(action, new Property("Content-Type", "application/json"));
        assertThat(actionConfiguration.getQueryParameters()).isNullOrEmpty();
        assertMethod(action, HttpMethod.POST);
        assertBody(action, "{\"message\": \"The force is strong with this one...\"}");
    }

    @Test
    public void testUrlEncodedData() throws AppsmithException {
        ActionDTO action = curlImporterService.curlToAction(
                "curl --data-urlencode '=all of this exactly, but url encoded ' http://loc"
        );
        assertMethod(action, HttpMethod.POST);
        assertUrl(action, "http://loc");
        assertEmptyBody(action);
        assertBodyFormData(
                action,
                new Property("", "all of this exactly, but url encoded ")
        );

        action = curlImporterService.curlToAction(
                "curl --data-urlencode 'spaced name=all of this exactly, but url encoded' http://loc"
        );
        assertMethod(action, HttpMethod.POST);
        assertUrl(action, "http://loc");
        assertEmptyBody(action);
        assertBodyFormData(
                action,
                new Property("spaced name", "all of this exactly, but url encoded")
        );

        action = curlImporterService.curlToAction(
                "curl --data-urlencode 'awesome=details, all of this exactly, but url encoded' http://loc"
        );
        assertMethod(action, HttpMethod.POST);
        assertUrl(action, "http://loc");
        assertEmptyBody(action);
        assertBodyFormData(
                action,
                new Property("awesome", "details, all of this exactly, but url encoded")
        );
    }

    @Test
    public void chromeCurlCommands1() throws AppsmithException {
        ActionDTO action = curlImporterService.curlToAction(
                "curl 'http://localhost:3000/applications/5ea054c531cc0f7a61af0cbe/pages/5ea054c531cc0f7a61af0cc0/edit/api' \\\n" +
                        "  -H 'Connection: keep-alive' \\\n" +
                        "  -H 'Cache-Control: max-age=0' \\\n" +
                        "  -H 'Upgrade-Insecure-Requests: 1' \\\n" +
                        "  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36' \\\n" +
                        "  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' \\\n" +
                        "  -H 'Sec-Fetch-Site: same-origin' \\\n" +
                        "  -H 'Sec-Fetch-Mode: navigate' \\\n" +
                        "  -H 'Sec-Fetch-User: ?1' \\\n" +
                        "  -H 'Sec-Fetch-Dest: document' \\\n" +
                        "  -H 'Accept-Language: en-GB,en-US;q=0.9,en;q=0.8' \\\n" +
                        "  -H 'Cookie: SESSION=1e3f32c2-cc72-4771-8ed5-40a9b15de0ef' \\\n" +
                        "  --compressed ;\n"
        );
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "http://localhost:3000");
        assertPath(action, "/applications/5ea054c531cc0f7a61af0cbe/pages/5ea054c531cc0f7a61af0cc0/edit/api");
        assertHeaders(action,
                new Property("Connection", "keep-alive"),
                new Property("Cache-Control", "max-age=0"),
                new Property("Upgrade-Insecure-Requests", "1"),
                new Property("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36"),
                new Property("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"),
                new Property("Sec-Fetch-Site", "same-origin"),
                new Property("Sec-Fetch-Mode", "navigate"),
                new Property("Sec-Fetch-User", "?1"),
                new Property("Sec-Fetch-Dest", "document"),
                new Property("Accept-Language", "en-GB,en-US;q=0.9,en;q=0.8"),
                new Property("Cookie", "SESSION=1e3f32c2-cc72-4771-8ed5-40a9b15de0ef")
        );

        action = curlImporterService.curlToAction(
                "curl 'http://localhost:3000/static/js/bundle.js' \\\n" +
                        "  -H 'Connection: keep-alive' \\\n" +
                        "  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36' \\\n" +
                        "  -H 'If-None-Match: W/\"8bdb-LUN0UH41MBBa7I+k9MElog5H+1I\"' \\\n" +
                        "  -H 'Accept: */*' \\\n" +
                        "  -H 'Sec-Fetch-Site: same-origin' \\\n" +
                        "  -H 'Sec-Fetch-Mode: no-cors' \\\n" +
                        "  -H 'Sec-Fetch-Dest: script' \\\n" +
                        "  -H 'Referer: http://localhost:3000/applications/5ea054c531cc0f7a61af0cbe/pages/5ea054c531cc0f7a61af0cc0/edit/api' \\\n" +
                        "  -H 'Accept-Language: en-GB,en-US;q=0.9,en;q=0.8' \\\n" +
                        "  -H 'Cookie: SESSION=1e3f32c2-cc72-4771-8ed5-40a9b15de0ef' \\\n" +
                        "  --compressed ;\n"
        );
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "http://localhost:3000");
        assertPath(action, "/static/js/bundle.js");
        assertHeaders(action,
                new Property("Connection", "keep-alive"),
                new Property("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.122 Safari/537.36"),
                new Property("If-None-Match", "W/\"8bdb-LUN0UH41MBBa7I+k9MElog5H+1I\""),
                new Property("Accept", "*/*"),
                new Property("Sec-Fetch-Site", "same-origin"),
                new Property("Sec-Fetch-Mode", "no-cors"),
                new Property("Sec-Fetch-Dest", "script"),
                new Property("Referer", "http://localhost:3000/applications/5ea054c531cc0f7a61af0cbe/pages/5ea054c531cc0f7a61af0cc0/edit/api"),
                new Property("Accept-Language", "en-GB,en-US;q=0.9,en;q=0.8"),
                new Property("Cookie", "SESSION=1e3f32c2-cc72-4771-8ed5-40a9b15de0ef")
        );
    }

    @Test
    public void firefoxCurlCommands1() throws AppsmithException {
        final ActionDTO action = curlImporterService.curlToAction("curl 'http://localhost:8080/api/v1/actions?applicationId=5ea054c531cc0f7a61af0cbe' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:75.0) Gecko/20100101 Firefox/75.0' -H 'Accept: application/json, text/plain, */*' -H 'Accept-Language: en-US,en;q=0.5' --compressed -H 'Origin: http://localhost:3000' -H 'DNT: 1' -H 'Connection: keep-alive' -H 'Referer: http://localhost:3000/' -H 'Cookie: SESSION=69b4b392-03b6-4e0a-a889-49ca4b8e267e'");
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "http://localhost:8080");
        assertPath(action, "/api/v1/actions");
        assertQueryParams(action, new Property("applicationId", "5ea054c531cc0f7a61af0cbe"));
        assertHeaders(action,
                new Property("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:75.0) Gecko/20100101 Firefox/75.0"),
                new Property("Accept", "application/json, text/plain, */*"),
                new Property("Accept-Language", "en-US,en;q=0.5"),
                new Property("Origin", "http://localhost:3000"),
                new Property("DNT", "1"),
                new Property("Connection", "keep-alive"),
                new Property("Referer", "http://localhost:3000/"),
                new Property("Cookie", "SESSION=69b4b392-03b6-4e0a-a889-49ca4b8e267e")
        );
    }

    @Test
    public void postmanExportCommands1() throws AppsmithException {
        final ActionDTO action = curlImporterService.curlToAction(
                "curl --location --request PUT 'https://release-api.appsmith.com/api/v1/users/5d81feb218e1c8217d20e13f' \\\n" +
                        "--header 'Content-Type: application/json' \\\n" +
                        "--header 'Authorization: Basic abcdefghijklmnop==' \\\n" +
                        "--header 'Content-Type: text/plain' \\\n" +
                        "--data-raw '{\n" +
                        "\t\"organizationId\" : \"5d8c9e946599b93bd51a3400\"\n" +
                        "}'"
        );
        assertMethod(action, HttpMethod.PUT);
        assertUrl(action, "https://release-api.appsmith.com");
        assertPath(action, "/api/v1/users/5d81feb218e1c8217d20e13f");
        assertHeaders(action,
                new Property("Content-Type", "application/json"),
                new Property("Authorization", "Basic abcdefghijklmnop=="),
                new Property("Content-Type", "text/plain")
        );
        assertBody(action, "{\n" +
                "\t\"organizationId\" : \"5d8c9e946599b93bd51a3400\"\n" +
                "}");
    }

    @Test
    public void postmanCreateDatasource() throws AppsmithException {
        final ActionDTO action = curlImporterService.curlToAction(
                "curl --location --request POST 'https://release-api.appsmith.com/api/v1/datasources' \\\n" +
                        "--header 'Content-Type: application/json' \\\n" +
                        "--header 'Cookie: SESSION=61ee9df5-3cab-400c-831b-9533218d8f9f' \\\n" +
                        "--header 'Content-Type: text/plain' \\\n" +
                        "--data-raw '{\n" +
                        "    \"name\": \"testPostgres\",\n" +
                        "    \"datasourceConfiguration\": {\n" +
                        "    \t\"url\" : \"jdbc:postgresql://appsmith-test-db.cgg2px8dsrli.ap-south-1.rds.amazonaws.com\",\n" +
                        "        \"databaseName\": \"postgres\",\n" +
                        "        \"authentication\" : {\n" +
                        "        \t\"username\" : \"postgres\",\n" +
                        "        \t\"password\" : \"qwerty1234\"\n" +
                        "        }\n" +
                        "    },\n" +
                        "    \"pluginId\": \"5e54eb6a05f86f6b7ad1fb53\"\n" +
                        "}\t'"
        );
        assertMethod(action, HttpMethod.POST);
        assertUrl(action, "https://release-api.appsmith.com");
        assertPath(action, "/api/v1/datasources");
        assertHeaders(action,
                new Property("Content-Type", "application/json"),
                new Property("Cookie", "SESSION=61ee9df5-3cab-400c-831b-9533218d8f9f"),
                new Property("Content-Type", "text/plain")
        );
        assertBody(action, "{\n" +
                "    \"name\": \"testPostgres\",\n" +
                "    \"datasourceConfiguration\": {\n" +
                "    \t\"url\" : \"jdbc:postgresql://appsmith-test-db.cgg2px8dsrli.ap-south-1.rds.amazonaws.com\",\n" +
                "        \"databaseName\": \"postgres\",\n" +
                "        \"authentication\" : {\n" +
                "        \t\"username\" : \"postgres\",\n" +
                "        \t\"password\" : \"qwerty1234\"\n" +
                "        }\n" +
                "    },\n" +
                "    \"pluginId\": \"5e54eb6a05f86f6b7ad1fb53\"\n" +
                "}\t");
    }

    @Test
    public void postmanCreateProvider() throws AppsmithException {
        final ActionDTO action = curlImporterService.curlToAction(
                "curl --location --request POST 'https://release-api.appsmith.com/api/v1/providers' \\\n" +
                        "--header 'Cookie: SESSION=61ee9df5-3cab-400c-831b-9533218d8f9f' \\\n" +
                        "--header 'Content-Type: application/json' \\\n" +
                        "--header 'Content-Type: application/json' \\\n" +
                        "--data-raw '{\n" +
                        "    \"name\": \"Delta Video\",\n" +
                        "    \"description\": \"This is a video\",\n" +
                        "    \"url\": \"http://delta.com\",\n" +
                        "    \"imageUrl\": \"http://delta-font.com\",\n" +
                        "    \"documentationUrl\": \"http://delta-documentation.com\",\n" +
                        "    \"credentialSteps\": \"Here goes the steps to create documentation in a long string\",\n" +
                        "    \"categories\": [\n" +
                        "        \"Video\"\n" +
                        "    ],\n" +
                        "    \"statistics\": {\n" +
                        "        \"imports\": 1289,\n" +
                        "        \"averageLatency\": 230,\n" +
                        "        \"successRate\": 99.7\n" +
                        "    },\n" +
                        "    \"datasourceConfiguration\": {\n" +
                        "        \"url\": \"http://google.com\",\n" +
                        "        \"headers\": [\n" +
                        "            {\n" +
                        "                \"key\": \"header1\",\n" +
                        "                \"value\": \"value1\"\n" +
                        "            }\n" +
                        "        ]\n" +
                        "    }\n" +
                        "}'"
        );
        assertMethod(action, HttpMethod.POST);
        assertUrl(action, "https://release-api.appsmith.com");
        assertPath(action, "/api/v1/providers");
        assertHeaders(action,
                new Property("Cookie", "SESSION=61ee9df5-3cab-400c-831b-9533218d8f9f"),
                new Property("Content-Type", "application/json"),
                new Property("Content-Type", "application/json")
        );
        assertBody(action, "{\n" +
                "    \"name\": \"Delta Video\",\n" +
                "    \"description\": \"This is a video\",\n" +
                "    \"url\": \"http://delta.com\",\n" +
                "    \"imageUrl\": \"http://delta-font.com\",\n" +
                "    \"documentationUrl\": \"http://delta-documentation.com\",\n" +
                "    \"credentialSteps\": \"Here goes the steps to create documentation in a long string\",\n" +
                "    \"categories\": [\n" +
                "        \"Video\"\n" +
                "    ],\n" +
                "    \"statistics\": {\n" +
                "        \"imports\": 1289,\n" +
                "        \"averageLatency\": 230,\n" +
                "        \"successRate\": 99.7\n" +
                "    },\n" +
                "    \"datasourceConfiguration\": {\n" +
                "        \"url\": \"http://google.com\",\n" +
                "        \"headers\": [\n" +
                "            {\n" +
                "                \"key\": \"header1\",\n" +
                "                \"value\": \"value1\"\n" +
                "            }\n" +
                "        ]\n" +
                "    }\n" +
                "}");
    }

    @Test
    public void parseCurlJsTestsPart1() throws AppsmithException {
        // Tests adapted from <https://github.com/tj/parse-curl.js/blob/master/test.js>.

        ActionDTO action = curlImporterService.curlToAction("curl http://api.sloths.com");
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "http://api.sloths.com");
        assertEmptyHeaders(action);

        action = curlImporterService.curlToAction("curl -H \"Origin: https://example.com\" https://example.com");
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "https://example.com");
        assertHeaders(action, new Property("Origin", "https://example.com"));

        action = curlImporterService.curlToAction("curl -X DELETE http://api.sloths.com/sloth/4");
        assertMethod(action, HttpMethod.DELETE);
        assertUrl(action, "http://api.sloths.com");
        assertPath(action, "/sloth/4");
        assertEmptyHeaders(action);

        action = curlImporterService.curlToAction("curl -XPUT http://api.sloths.com/sloth/5");
        assertMethod(action, HttpMethod.PUT);
        assertUrl(action, "http://api.sloths.com");
        assertPath(action, "/sloth/5");
        assertEmptyHeaders(action);

        action = curlImporterService.curlToAction("curl https://api.sloths.com");
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "https://api.sloths.com");
        assertEmptyPath(action);
        assertEmptyHeaders(action);
        assertEmptyBody(action);

        action = curlImporterService.curlToAction("curl -u tobi:ferret https://api.sloths.com");
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "https://api.sloths.com");
        assertEmptyPath(action);
        assertHeaders(action, new Property("Authorization", "Basic dG9iaTpmZXJyZXQ="));
        assertEmptyBody(action);
    }

    @Test
    public void parseCurlJsTestsPart2() throws AppsmithException {
        ActionDTO action = curlImporterService.curlToAction("curl -d \"foo=bar\" https://api.sloths.com");
        assertMethod(action, HttpMethod.POST);
        assertUrl(action, "https://api.sloths.com");
        assertEmptyPath(action);
        assertHeaders(action, new Property("Content-Type", "application/x-www-form-urlencoded"));
        assertEmptyBody(action);
        assertBodyFormData(
                action,
                new Property("foo", "bar")
        );

        action = curlImporterService.curlToAction("curl -d \"foo=bar\" -d bar=baz https://api.sloths.com");
        assertMethod(action, HttpMethod.POST);
        assertUrl(action, "https://api.sloths.com");
        assertEmptyPath(action);
        assertHeaders(action,  new Property("Content-Type", "application/x-www-form-urlencoded"));
        assertEmptyBody(action);
        assertBodyFormData(
                action,
                new Property("foo", "bar"),
                new Property("bar", "baz")
        );

        action = curlImporterService.curlToAction("curl -H \"Accept: text/plain\" --header \"User-Agent: slothy\" https://api.sloths.com");
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "https://api.sloths.com");
        assertEmptyPath(action);
        assertHeaders(action,
                new Property("Accept", "text/plain"),
                new Property("User-Agent", "slothy")
        );
        assertEmptyBody(action);

        action = curlImporterService.curlToAction("curl -H 'Accept: text/*' --header 'User-Agent: slothy' https://api.sloths.com");
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "https://api.sloths.com");
        assertEmptyPath(action);
        assertHeaders(action,
                new Property("Accept", "text/*"),
                new Property("User-Agent", "slothy")
        );
        assertEmptyBody(action);

        action = curlImporterService.curlToAction("curl -H 'Accept: text/*' -A slothy https://api.sloths.com");
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "https://api.sloths.com");
        assertEmptyPath(action);
        assertHeaders(action,
                new Property("Accept", "text/*"),
                new Property("User-Agent", "slothy")
        );
        assertEmptyBody(action);

        action = curlImporterService.curlToAction("curl -b 'foo=bar' slothy https://api.sloths.com");
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "https://api.sloths.com");
        assertEmptyPath(action);
        assertHeaders(action, new Property("Set-Cookie", "foo=bar"));
        assertEmptyBody(action);

        action = curlImporterService.curlToAction("curl --cookie 'foo=bar' slothy https://api.sloths.com");
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "https://api.sloths.com");
        assertEmptyPath(action);
        assertHeaders(action, new Property("Set-Cookie", "foo=bar"));
        assertEmptyBody(action);

        action = curlImporterService.curlToAction("curl --cookie 'species=sloth;type=galactic' slothy https://api.sloths.com");
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "https://api.sloths.com");
        assertEmptyPath(action);
        assertHeaders(action, new Property("Set-Cookie", "species=sloth;type=galactic"));
        assertEmptyBody(action);
    }

    @Test
    public void parseWithoutProtocol() throws AppsmithException {
        ActionDTO action = curlImporterService.curlToAction("curl api.sloths.com");
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "http://api.sloths.com");
        assertEmptyPath(action);
        assertEmptyHeaders(action);
        assertEmptyBody(action);
    }

    @Test
    public void parseWithDashedUrlArgument() throws AppsmithException {
        ActionDTO action = curlImporterService.curlToAction("curl --url http://api.sloths.com");
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "http://api.sloths.com");
        assertEmptyPath(action);
        assertEmptyHeaders(action);
        assertEmptyBody(action);
    }

    @Test
    public void parseWithDashedUrlArgument2() throws AppsmithException {
        ActionDTO action = curlImporterService.curlToAction("curl -X POST -d '{\"name\":\"test\",\"salary\":\"123\",\"age\":\"23\"}' --url http://dummy.restapiexample.com/api/v1/create");
        assertMethod(action, HttpMethod.POST);
        assertUrl(action, "http://dummy.restapiexample.com");
        assertPath(action, "/api/v1/create");
        assertHeaders(action, new Property("Content-Type", "application/x-www-form-urlencoded"));
        assertEmptyBody(action);
        assertBodyFormData(
                action,
                new Property("{\"name\":\"test\",\"salary\":\"123\",\"age\":\"23\"}", "")
        );
    }

    @Test
    public void parseWithJson() throws AppsmithException {
        ActionDTO action = curlImporterService.curlToAction("curl -X POST -H'Content-Type: application/json' -d '{\"name\":\"test\",\"salary\":\"123\",\"age\":\"23\"}' --url http://dummy.restapiexample.com/api/v1/create");
        assertMethod(action, HttpMethod.POST);
        assertUrl(action, "http://dummy.restapiexample.com");
        assertPath(action, "/api/v1/create");
        assertHeaders(action, new Property("Content-Type", "application/json"));
        assertBody(action, "{\"name\":\"test\",\"salary\":\"123\",\"age\":\"23\"}");
    }

    @Test
    public void parseWithSpacedHeader() throws AppsmithException {
        ActionDTO action = curlImporterService.curlToAction("curl -H \"Accept:application/json\" http://httpbin.org/get");
        assertMethod(action, HttpMethod.GET);
        assertUrl(action, "http://httpbin.org");
        assertPath(action, "/get");
        assertHeaders(action, new Property("Accept", "application/json"));
        assertEmptyBody(action);
    }

    @Test
    public void parseCurlCommand1() throws AppsmithException {
        ActionDTO action = curlImporterService.curlToAction("curl -i -H \"Accept: application/json\" -H \"Content-Type: application/json\" -X POST -d '{\"name\":\"test\",\"salary\":\"123\",\"age\":\"23\"}' --url http://dummy.restapiexample.com/api/v1/create");
        assertMethod(action, HttpMethod.POST);
        assertUrl(action, "http://dummy.restapiexample.com");
        assertPath(action, "/api/v1/create");
        assertHeaders(action, new Property("Accept", "application/json"), new Property("Content-Type", "application/json"));
        assertBody(action, "{\"name\":\"test\",\"salary\":\"123\",\"age\":\"23\"}");
    }

    @Test
    public void parseMultipleData() throws AppsmithException {
        ActionDTO action = curlImporterService.curlToAction("curl https://api.stripe.com/v1/refunds -d payment_intent=pi_Aabcxyz01aDfoo -d amount=1000");
        assertMethod(action, HttpMethod.POST);
        assertUrl(action, "https://api.stripe.com");
        assertPath(action, "/v1/refunds");
        assertHeaders(action, new Property("Content-Type", "application/x-www-form-urlencoded"));
        assertEmptyBody(action);
        assertBodyFormData(
                action,
                new Property("payment_intent", "pi_Aabcxyz01aDfoo"),
                new Property("amount", "1000")
        );
    }

    @Test
    public void parseMultiFormData() throws AppsmithException {
        // In the curl command, we test for a combination of --form and -F
        // Also some values are double-quoted while some aren't. This tests a permutation of all such fields
        ActionDTO action = curlImporterService.curlToAction("curl --request POST 'http://httpbin.org/post' -F 'somekey=value' --form 'anotherKey=\"anotherValue\"'");
        assertMethod(action, HttpMethod.POST);
        assertUrl(action, "http://httpbin.org");
        assertPath(action, "/post");
        assertHeaders(action, new Property("Content-Type", "multipart/form-data"));
        assertEmptyBody(action);
        assertBodyFormData(
                action,
                new Property("somekey", "value"),
                new Property("anotherKey", "anotherValue")
        );
    }

    @Test
    public void dontEatBackslashesInSingleQuotes() throws AppsmithException {
        ActionDTO action = curlImporterService.curlToAction("curl http://httpbin.org/post -d 'a\\n'");
        assertMethod(action, HttpMethod.POST);
        assertUrl(action, "http://httpbin.org");
        assertPath(action, "/post");
        assertHeaders(action, new Property("Content-Type", "application/x-www-form-urlencoded"));
        assertEmptyBody(action);
        assertBodyFormData(
                action,
                new Property("a\\n", "")
        );
    }

    @Test
    public void importInvalidMethod() {
        assertThatThrownBy(() -> {
            curlImporterService.curlToAction("curl -X invalid-method http://httpbin.org/get");
        })
                .isInstanceOf(AppsmithException.class)
                .matches(err -> ((AppsmithException) err).getError() == AppsmithError.INVALID_CURL_METHOD);
    }

    @Test
    public void importInvalidHeader() {
        assertThatThrownBy(() -> {
            curlImporterService.curlToAction("curl -H x-custom http://httpbin.org/headers");
        })
                .isInstanceOf(AppsmithException.class)
                .matches(err -> ((AppsmithException) err).getError() == AppsmithError.INVALID_CURL_HEADER);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importInvalidCurlCommand() {
        String command = "invalid curl command here";

        Mono<ActionDTO> actionMono = curlImporterService.importAction(command, "pageId", "actionName", orgId, null);

        StepVerifier
                .create(actionMono)
                .verifyError();
    }

    // Assertion utilities for working with Action assertions.
    private static void assertMethod(ActionDTO action, HttpMethod method) {
        assertThat(action.getActionConfiguration().getHttpMethod()).isEqualByComparingTo(method);
    }

    private static void assertUrl(ActionDTO action, String url) {
        assertThat(action.getDatasource().getDatasourceConfiguration().getUrl()).isEqualTo(url);
    }

    private static void assertEmptyPath(ActionDTO action) {
        assertThat(action.getActionConfiguration().getPath()).isNullOrEmpty();
    }

    private static void assertPath(ActionDTO action, String path) {
        assertThat(action.getActionConfiguration().getPath()).isEqualTo(path);
    }

    private static void assertQueryParams(ActionDTO action, Property... params) {
        assertThat(action.getActionConfiguration().getQueryParameters()).containsExactly(params);
    }

    private static void assertEmptyHeaders(ActionDTO action) {
        assertThat(action.getActionConfiguration().getHeaders()).isNullOrEmpty();
    }

    private static void assertHeaders(ActionDTO action, Property... headers) {
        assertThat(action.getActionConfiguration().getHeaders()).containsExactlyInAnyOrder(headers);
    }

    private static void assertEmptyBody(ActionDTO action) {
        assertThat(action.getActionConfiguration().getBody()).isNullOrEmpty();
    }

    private static void assertBody(ActionDTO action, String body) {
        assertThat(action.getActionConfiguration().getBody()).isEqualTo(body);
    }

    private static void assertBodyFormData(ActionDTO action, Property... params) {
        assertThat(action.getActionConfiguration().getBodyFormData()).containsExactly(params);
    }

}
