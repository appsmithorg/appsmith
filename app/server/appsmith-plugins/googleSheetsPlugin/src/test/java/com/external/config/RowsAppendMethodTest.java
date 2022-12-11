package com.external.config;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.OAuth2;
import com.external.constants.ErrorMessages;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import reactor.test.StepVerifier;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;


import java.util.Map;

@Slf4j
public class RowsAppendMethodTest {

    final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * To Test if it passes the empty Mono criteria,
     * else it should fail
     */
    @Test
    public void testBulkAppendHandleEmptyMonoExecutePrerequisites() {
        String[] testDataArray = {"{}", ""};

        for(int i=0; i<testDataArray.length; i++) {
            RowsAppendMethod rowsAppendMethod = new RowsAppendMethod(objectMapper);

            int currentIndex = i;
            AppsmithPluginException appsmithPluginException = assertThrows(AppsmithPluginException.class, () -> {
                rowsAppendMethod.executePrerequisites(getMethodConfigObject(testDataArray[currentIndex]), getOAuthObject());
            });

            String actualMessage = appsmithPluginException.getMessage();

            log.info("abc: {}",appsmithPluginException.getMessage());

            assertTrue(actualMessage.contains(ErrorMessages.EMPTY_ROW_OBJECT_MESSAGE));

        }
    }


    /**
     * Simulated oAuth2 object, just to bypass few case.
     * @return
     */
    private OAuth2 getOAuthObject(){
        OAuth2 oAuth2 = new OAuth2();
        oAuth2.setAuthenticationResponse(new AuthenticationResponse() );
        oAuth2.getAuthenticationResponse().setToken("welcome123");
        return oAuth2;
    }

    /**
     * Simulated MethodConfig object with testable data.
     * @param rowObject
     * @return
     */
    private  MethodConfig getMethodConfigObject(String rowObject) {
        MethodConfig methodConfig = new MethodConfig(Map.of());

        methodConfig.setRowObjects(rowObject);

        return methodConfig;
    }
}
