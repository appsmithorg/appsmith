package com.appsmith.server.configurations;

import com.appsmith.server.domains.UserData;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.skyscreamer.jsonassert.JSONAssert;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@Slf4j
@SpringBootTest
public class CommonConfigTest {

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * This method tests that objectMapper bean is created and it has Views.Public set as the default for the JsonView.
     */
    @Test
    public void objectMapper_BeanCreated_WithPublicJsonViewAsDefault() throws JsonProcessingException {
        UserData userData = new UserData();
        userData.setProficiency("abcd"); // this is public field
        userData.setUserId("userId"); // this is internal field
        userData.setUserPermissions(null);

        String value = objectMapper.writeValueAsString(userData);
        JSONAssert.assertEquals("{\"proficiency\":\"abcd\"}", value, true);
    }
}
