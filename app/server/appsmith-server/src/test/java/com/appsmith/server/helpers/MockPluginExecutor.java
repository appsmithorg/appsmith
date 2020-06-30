package com.appsmith.server.helpers;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceTestResult;
import com.appsmith.external.plugins.PluginExecutor;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Set;

public class MockPluginExecutor implements PluginExecutor {

    @Override
    public Mono<Object> execute(Object connection, DatasourceConfiguration datasourceConfiguration, ActionConfiguration actionConfiguration) {
        System.out.println("In the execute");
        return null;
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
