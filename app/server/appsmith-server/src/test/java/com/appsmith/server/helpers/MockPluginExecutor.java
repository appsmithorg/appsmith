package com.appsmith.server.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.plugins.PluginExecutor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.HashSet;
import java.util.Set;

@Slf4j
public class MockPluginExecutor implements PluginExecutor<Object> {

    @Override
    public Mono<Tuple2<ActionExecutionResult, Object>> execute(Object connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
        if (actionConfiguration == null) {
            return Mono.error(new Exception("ActionConfiguration is null"));
        }
        if (datasourceConfiguration == null) {
            return Mono.error(new Exception("DatasourceConfiguration is null"));
        }
        System.out.println("In the execute");
        log.info("In the execute");

        ActionExecutionResult actionExecutionResult = new ActionExecutionResult();
        actionExecutionResult.setBody("");
        actionExecutionResult.setIsExecutionSuccess(true);
        actionExecutionResult.setStatusCode("200");
        return Mono.zip(Mono.just(actionExecutionResult), Mono.just(new MockUpdatableConnection()));
    }

    @Override
    public Mono<Object> datasourceCreate(DatasourceConfiguration datasourceConfiguration) {
        System.out.println("In the datasourceCreate");
        return Mono.just(new Object());
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
