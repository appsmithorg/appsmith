package com.appsmith.external.factories;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

public class HikariDataSourceConnectionFactory implements DataSourceConnectionFactory<HikariDataSource, HikariConfig> {
    @Override
    public HikariDataSource getDataSourceConnection(HikariConfig properties) {
        return new HikariDataSource(properties);
    }
}
