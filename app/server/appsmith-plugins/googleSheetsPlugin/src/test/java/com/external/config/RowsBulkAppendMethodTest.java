package com.external.config;

import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.OAuth2;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Map;

public class RowsBulkAppendMethodTest {
    final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * To Test if it passes the empty Mono criteria,
     * else it should fail
     */
    @Test
    public void testBulkAppendHandleEmptyMonoExecutePrerequisites() {
        String[] testDataArray = {"[]", ""};

        for(int i=0; i<testDataArray.length; i++) {
            RowsBulkAppendMethod bulkAppend = new RowsBulkAppendMethod(objectMapper);
            Mono<Object> monoTest = bulkAppend.executePrerequisites(getMethodConfigObject(testDataArray[i]), getOAuthObject());

            StepVerifier.create(monoTest)
                    .expectComplete()
                    .verify();
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