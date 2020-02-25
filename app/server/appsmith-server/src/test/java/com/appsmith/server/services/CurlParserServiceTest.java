package com.appsmith.server.services;

import org.springframework.beans.factory.annotation.Autowired;

//@RunWith(SpringRunner.class)
//@SpringBootTest
//@Slf4j
public class CurlParserServiceTest {
    @Autowired
    CurlImporterService curlImporterService;

    /**
     * TODO Make the test case run
     * Currently the test case doesnt run because the import now requires the rest api plugin during create. This is because
     * the datasource needs to be validated (which is done at a plugin level). No current fix exists to mock out the
     * plugin as of now.
     */
//    @Test
//    public void testParser() {
//        String command = "curl -X GET http://localhost:8080/api/v1/actions?name=something -H 'Accept: */*' -H 'Accept-Encoding: gzip, deflate' -H 'Authorization: Basic YXBpX3VzZXI6OHVBQDsmbUI6Y252Tn57Iw==' -H 'Cache-Control: no-cache' -H 'Connection: keep-alive' -H 'Content-Type: application/json' -H 'Cookie: SESSION=97c5def4-4f72-45aa-96fe-e8a9f5ade0b5,SESSION=97c5def4-4f72-45aa-96fe-e8a9f5ade0b5; SESSION=' -H 'Host: localhost:8080' -H 'Postman-Token: 16e4b6bc-2c7a-4ab1-a127-bca382dfc0f0,a6655daa-db07-4c5e-aca3-3fd505bd230d' -H 'User-Agent: PostmanRuntime/7.20.1' -H 'cache-control: no-cache' -d '{someJson}' ";
//        Mono<Action> action = curlImporterService.importAction(command, "pageId", "actionName");
//        StepVerifier
//                .create(action)
//                .assertNext(action1 -> {
//                    assertThat(action1).isNotNull();
//                    assertThat(action1.getDatasource()).isNotNull();
//                    assertThat(action1.getDatasource().getDatasourceConfiguration()).isNotNull();
//                    assertThat(action1.getDatasource().getDatasourceConfiguration().getUrl()).isEqualTo("http://localhost:8080/api/v1/actions");
//                    assertThat(action1.getActionConfiguration().getHeaders().size()).isEqualTo(11);
//                    assertThat(action1.getActionConfiguration().getQueryParameters().size()).isEqualTo(1);
//                    assertThat(action1.getActionConfiguration().getHttpMethod()).isEqualTo(HttpMethod.GET);
//                    assertThat(action1.getActionConfiguration().getBody()).isEqualTo("{someJson}");
//                })
//                .verifyComplete();
//    }
}
