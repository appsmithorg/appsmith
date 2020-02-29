package com.appsmith.server.services;

import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.domains.Action;
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

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class CurlImporterServiceTest {
    @Autowired
    CurlImporterService curlImporterService;

    @MockBean
    PluginManager pluginManager;

    @MockBean
    PluginExecutor pluginExecutor;

    @Before
    public void setup() throws IOException {
        Mockito.when(this.pluginManager.getExtensions(Mockito.any(), Mockito.anyString()))
                .thenReturn(List.of(this.pluginExecutor));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void importValidCurlCommand() {
        String command = "curl -X GET http://localhost:8080/api/v1/actions?name=something -H 'Accept: */*' -H 'Accept-Encoding: gzip, deflate' -H 'Authorization: Basic YXBpX3VzZXI6OHVBQDsmbUI6Y252Tn57Iw==' -H 'Cache-Control: no-cache' -H 'Connection: keep-alive' -H 'Content-Type: application/json' -H 'Cookie: SESSION=97c5def4-4f72-45aa-96fe-e8a9f5ade0b5,SESSION=97c5def4-4f72-45aa-96fe-e8a9f5ade0b5; SESSION=' -H 'Host: localhost:8080' -H 'Postman-Token: 16e4b6bc-2c7a-4ab1-a127-bca382dfc0f0,a6655daa-db07-4c5e-aca3-3fd505bd230d' -H 'User-Agent: PostmanRuntime/7.20.1' -H 'cache-control: no-cache' -d '{someJson}'";
        Mono<Action> action = curlImporterService.importAction(command, "pageId", "actionName");
        StepVerifier
                .create(action)
                .assertNext(action1 -> {
                    assertThat(action1).isNotNull();
                    assertThat(action1.getDatasource()).isNotNull();
                    assertThat(action1.getDatasource().getDatasourceConfiguration()).isNotNull();
                    assertThat(action1.getDatasource().getDatasourceConfiguration().getUrl()).isEqualTo("http://localhost:8080");
                    assertThat(action1.getActionConfiguration().getPath()).isEqualTo("/api/v1/actions");
                    assertThat(action1.getActionConfiguration().getHeaders().size()).isEqualTo(11);
                    assertThat(action1.getActionConfiguration().getQueryParameters().size()).isEqualTo(1);
                    assertThat(action1.getActionConfiguration().getHttpMethod()).isEqualTo(HttpMethod.GET);
                    assertThat(action1.getActionConfiguration().getBody()).isEqualTo("{someJson}");
                })
                .verifyComplete();
    }
}

