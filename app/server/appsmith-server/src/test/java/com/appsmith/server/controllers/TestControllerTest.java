package com.appsmith.server.controllers;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.SecurityTestConfig;
import com.appsmith.server.dtos.TestChild;
import com.appsmith.server.dtos.TestParent;
import com.appsmith.server.services.OrganizationService;
import com.appsmith.server.services.UserOrganizationService;
import com.appsmith.server.services.UserService;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.reactive.function.BodyInserters;

@RunWith(SpringRunner.class)
@WebFluxTest(TestController.class)
@Import(SecurityTestConfig.class)
public class TestControllerTest {
    @Autowired
    private WebTestClient webTestClient;

    @Test
    @WithMockUser
    public void testPolymorphism() {
        TestChild test = new TestChild();
        test.setTestChild("something");
        test.setTestField("some other thing");
        test.setType(".TestChild");
        webTestClient.post().uri("/api/v1/test").
                contentType(MediaType.APPLICATION_JSON).
                body(BodyInserters.fromValue(test)).
                exchange().
                expectStatus().isEqualTo(400);
    }
}
