package com.external.plugins;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

public class SaasPluginTest {

    private final SaasPlugin.SaasPluginExecutor pluginExecutor = new SaasPlugin.SaasPluginExecutor(() -> 10 * 1024 * 1024);

    @Test
    public void testExecute_nullInputs_returnsError() throws JsonProcessingException {

        ObjectMapper objectMapper = new ObjectMapper();

        final DatasourceConfiguration datasourceConfiguration = objectMapper.readValue("{\n" +
                "        \"authentication\" : {\n" +
                "            \"username\" : \"test\",\n" +
                "            \"password\" : \"test\",\n" +
                "            \"authenticationType\" : \"basic\"\n" +
                "        },\n" +
                "        \"sshProxyEnabled\" : false,\n" +
                "        \"properties\" : [ \n" +
                "            {\n" +
                "                \"key\" : \"isSendSessionEnabled\",\n" +
                "                \"value\" : \"N\"\n" +
                "            }, \n" +
                "            {\n" +
                "                \"key\" : \"sessionSignatureKey\",\n" +
                "                \"value\" : \"\"\n" +
                "            }\n" +
                "        ],\n" +
                "        \"url\" : \"https://envyenksqii9nf3.m.pipedream.net\",\n" +
                "        \"headers\" : [{\"key\":\"test\", \"value\":\"bla\"}]\n" +
                "    }", DatasourceConfiguration.class);

        final ActionConfiguration actionConfiguration = objectMapper.readValue("{\n" +
                "            \"timeoutInMillisecond\" : 10000,\n" +
                "            \"paginationType\" : \"NONE\",\n" +
                "            \"headers\" : [ \n" +
                "                {\n" +
                "                    \"key\" : \"\",\n" +
                "                    \"value\" : \"\"\n" +
                "                }, \n" +
                "                {\n" +
                "                    \"key\" : \"\",\n" +
                "                    \"value\" : \"\"\n" +
                "                }\n" +
                "            ],\n" +
                "            \"encodeParamsToggle\" : true,\n" +
                "            \"queryParameters\" : [ \n" +
                "                {\n" +
                "                    \"key\" : \"\",\n" +
                "                    \"value\" : \"\"\n" +
                "                }, \n" +
                "                {\n" +
                "                    \"key\" : \"\",\n" +
                "                    \"value\" : \"\"\n" +
                "                }\n" +
                "            ],\n" +
                "            \"body\" : \"\",\n" +
                "            \"httpMethod\" : \"GET\",\n" +
                "            \"pluginSpecifiedTemplates\" : [ \n" +
                "                {\n" +
                "                    \"value\" : false\n" +
                "                }\n" +
                "            ]\n" +
                "        }", ActionConfiguration.class);

        final Mono<ActionExecutionResult> execute = pluginExecutor.execute(null, datasourceConfiguration, actionConfiguration);

        StepVerifier.create(execute)
                .assertNext(test -> System.out.println(test))
                .verifyComplete();
    }

}