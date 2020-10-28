package com.appsmith.server.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.plugins.PluginExecutor;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Set;

public class MockPluginExecutor implements PluginExecutor {

    @Override
    public Mono<ActionExecutionResult> execute(Object connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
        if (actionConfiguration == null) {
            return Mono.error(new Exception("ActionConfiguration is null"));
        }
        if (datasourceConfiguration == null) {
            return Mono.error(new Exception("DatasourceConfiguration is null"));
        }
        System.out.println("In the execute");

        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
        actionExecutionResult.setBody("");
        actionExecutionResult.setIsExecutionSuccess(true);
        actionExecutionResult.setStatusCode("200");
        return Mono.just(actionExecutionResult);
    }

    @Override
    public Mono<Object> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
        System.out.println("In the datasourceCreate");
        return Mono.empty();
    }

    @Override
    public void datasourceDestroy(Object connection) {
        System.out.println("In the datasourceDestroy");

    }

    @Override
    public Set<String> validateDatasource(DatasourceConfiguration datasourceConfiguration) {
        System.out.println("In the datasourceValidate");
        return new HashSet<>();
    }

    @Override
    public Mono<DatasourceTestResult> testDatasource(DatasourceConfiguration datasourceConfiguration) {
        return Mono.just(new DatasourceTestResult());
    }

}
