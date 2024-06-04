package com.appsmith.server.migrations;

import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.api.configuration.Configuration;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.flywaydb.core.api.resolver.ResolvedMigration;
import org.flywaydb.core.internal.jdbc.StatementInterceptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

/**
 * Guidelines for writing a new migration:
 * <br>
 * 1. Naming convention: <br>
 *    a. Incremental migrations should be named <code>V{version}__{description}.java</code> <br>
 *    b. Repeatable migrations should be named <code>R__{description}.java</code> <br>
 */
@Slf4j
public abstract class AppsmithJavaMigration extends BaseJavaMigration {
    @Override
    public ResolvedMigration getResolvedMigration(Configuration config, StatementInterceptor statementInterceptor) {
        return super.getResolvedMigration(config, statementInterceptor);
    }

    /**
     * This is a template method that calls the abstract method <code>migrate(JdbcTemplate jdbcTemplate)</code> which needs to implemented.
     */
    @Override
    public final void migrate(Context context) throws Exception {
        JdbcTemplate jdbcTemplate =
                new JdbcTemplate(new SingleConnectionDataSource(context.getConnection(), true), false);
        migrate(jdbcTemplate);
    }

    /**
     * Implement this method to perform the migration.
     */
    public abstract void migrate(JdbcTemplate jdbcTemplate) throws Exception;
}
