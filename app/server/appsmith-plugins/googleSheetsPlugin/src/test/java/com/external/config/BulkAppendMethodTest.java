package com.external.config;

import com.appsmith.external.models.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.BeforeClass;
import org.junit.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;

public class BulkAppendMethodTest {
    final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * To Test if it passes the empty Mono criteria,
     * else it should fail
     */
    @Test
    public void testBulkAppendHandleEmptyMonoExecutePrerequisites() {
        String[] testDataArray = {"[]", ""};

        for(int i=0; i<testDataArray.length; i++) {
            BulkAppendMethod bulkAppend = new BulkAppendMethod(objectMapper);
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
    private  MethodConfig getMethodConfigObject(String rowObject){
        List properties = new ArrayList<Property>();
        MethodConfig methodConfig = new MethodConfig(properties);

        methodConfig.setRowObjects(rowObject);

        return methodConfig;
    }
}