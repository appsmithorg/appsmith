package com.appsmith.server.controllers;

import com.appsmith.server.configurations.SecurityTestConfig;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserOrganizationService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.solutions.UserSignup;
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

import java.util.Arrays;
import java.util.List;

@RunWith(SpringRunner.class)
@WebFluxTest(UserController.class)
@Import(SecurityTestConfig.class)
public class UserControllerTest {
    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private UserService userService;

    @MockBean
    private SessionUserService sessionUserService;

    @MockBean
    private UserOrganizationService userOrganizationService;

    @MockBean
    private UserSignup userSignup;

    @Test
    @WithMockUser
    public void createUserWithInvalidEmailAddress() {
        List<String> invalidAddresses = Arrays.asList(
                "plainaddress",
                "#@%^%#$@#$@#.com",
                "@example.com",
                "Joe Smith <email@example.com>",
                "email.example.com",
                "email@example@example.com",
                ".email@example.com",
                "email.@example.com",
                "email..email@example.com",
                "email@example.com (Joe Smith)",
                "email@-example.com",
                "email@example..com",
                "Abc..123@example.com"
        );
        for (String invalidAddress : invalidAddresses) {
            try {
                webTestClient.post().uri("/api/v1/users").
                        contentType(MediaType.APPLICATION_JSON).
                        body(BodyInserters.fromValue(String.format("{\"name\":\"test-name\"," +
                                "\"email\":\"%s\",\"password\":\"test-password\"}", invalidAddress))).
                        exchange().
                        expectStatus().isEqualTo(400).
                        expectBody().json("{\n" +
                        "    \"responseMeta\": {\n" +
                        "        \"status\": 400,\n" +
                        "        \"success\": false,\n" +
                        "        \"error\": {\n" +
                        "            \"code\": 4028,\n" +
                        "            \"message\": \"Validation Failure(s): {email=must be a well-formed email address}\"\n" +
                        "        }\n" +
                        "    }\n" +
                        "}");
            } catch (Throwable exc) {
                System.out.println("******************************");
                System.out.println(String.format("Failed for >>> %s", invalidAddress));
                System.out.println("******************************");
                throw exc;
            }
        }
    }
}
