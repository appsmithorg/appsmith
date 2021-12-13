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

    private static String accessKey;
    private static String secretKey;

    @BeforeClass
    public static void setUp() {
        accessKey   = "access_key";
        secretKey   = "secret_key";
    }

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
     * To Test if it passes the Non-empty Mono criteria,
     * down the line the code may fail which is not the scope of testing
     * that means, no code changes are done after empty Mono handling condition
     * for which this test is intended to run.
     */
    @Test
    public void testBulkAppendHandleNonEmptyMonoExecutePrerequisites() {
        String[] testDataArray = {
                "[{\"Sl #\":\"100\"}]",
                "[{}]",
                "[{\"Sl #\":\"100\"},{\"Sl#\":\"101\"}]",
                "[{\"Sl #\":\"100\",\"Topic\":\"topic\"}]"};

        for(int i=0; i<testDataArray.length; i++) {
            MethodConfig methodConfig = getMethodConfigObject(testDataArray[i]);
            BulkAppendMethod bulkAppend = new BulkAppendMethod(objectMapper);
            Mono<Object> monoTest = bulkAppend.executePrerequisites(methodConfig, getOAuthObject());

            StepVerifier
                    .create(monoTest)
                    .expectErrorMatches(throwable ->  throwable instanceof  java.lang.AssertionError);  }
    }

    /**
     * Simulated oAuth2 object, just to bypass few case.
     * @return
     */
    private OAuth2 getOAuthObject(){
        DatasourceConfiguration datasourceConfiguration = createDatasourceConfiguration();
        OAuth2 oAuth2 = new OAuth2();
        oAuth2.setAuthenticationResponse(datasourceConfiguration.getAuthentication().getAuthenticationResponse());
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

        methodConfig.setSpreadsheetUrl("https://docs.google.com/spreadsheets/d/test123$$/edit#gid=0");
        methodConfig.setSpreadsheetId("https://docs.google.com/spreadsheets/d");
        methodConfig.setTableHeaderIndex("1");
        methodConfig.setSheetName("Sheet1");
        methodConfig.setQueryFormat("Rows");
        methodConfig.setRowOffset("1");
        methodConfig.setRowLimit("1");
        methodConfig.setRowObjects(rowObject);

        return methodConfig;
    }

    /**
     * DatasourceConfiguration object need for creating OAuth
     * @return
     */
    private DatasourceConfiguration createDatasourceConfiguration() {
        DBAuth authDTO = new DBAuth();
        authDTO.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authDTO.setUsername(accessKey);
        authDTO.setPassword(secretKey);

        DatasourceConfiguration dsConfig = new DatasourceConfiguration();
        dsConfig.setAuthentication(authDTO);
        return dsConfig;
    }
}