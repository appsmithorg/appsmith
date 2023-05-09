package com.appsmith.external.factories;

public interface DataSourceConnectionFactory<C, P> {
    C getDataSourceConnection(P properties);
}
