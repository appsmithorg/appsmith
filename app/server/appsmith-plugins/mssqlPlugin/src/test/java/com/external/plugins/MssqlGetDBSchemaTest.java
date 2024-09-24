package com.external.plugins;

import com.appsmith.external.models.DatasourceStructure;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MSSQLServerContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.SQLException;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.external.plugins.MssqlTestDBContainerManager.createDatasourceConfiguration;
import static com.external.plugins.MssqlTestDBContainerManager.mssqlPluginExecutor;
import static com.external.plugins.MssqlTestDBContainerManager.runSQLQueryOnMssqlTestDB;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
@Disabled
public class MssqlGetDBSchemaTest {
    public static final String SQL_QUERY_TO_CREATE_TABLE_WITH_PRIMARY_KEY =
            "CREATE TABLE supplier\n" + "( supplier_id int not null,\n"
                    + "  supplier_name varchar(50) not null,\n"
                    + "  contact_name varchar(50),\n"
                    + "  CONSTRAINT supplier_pk PRIMARY KEY (supplier_id)\n"
                    + ")";

    public static final String SQL_QUERY_TO_CREATE_TABLE_WITH_FOREIGN_KEY =
            "CREATE TABLE products\n" + "( product_id int not null,\n"
                    + "  supplier_id int not null,\n"
                    + "  CONSTRAINT fk_supplier\n"
                    + "  FOREIGN KEY (supplier_id)\n"
                    + "  REFERENCES supplier(supplier_id)\n"
                    + ")";

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @Container
    private static final MSSQLServerContainer container = MssqlTestDBContainerManager.getMssqlDBForTest();

    private static HikariDataSource sharedConnectionPool = null;

    @BeforeAll
    public static void setup() throws SQLException {
        sharedConnectionPool = mssqlPluginExecutor
                .datasourceCreate(createDatasourceConfiguration(container))
                .block();
        createTablesForTest();
    }

    @Test
    public void testDBSchemaShowsAllTables() {
        Mono<DatasourceStructure> datasourceStructureMono =
                mssqlPluginExecutor.getStructure(sharedConnectionPool, createDatasourceConfiguration(container));

        StepVerifier.create(datasourceStructureMono)
                .assertNext(datasourceStructure -> {
                    Set<String> setOfAllTableNames = datasourceStructure.getTables().stream()
                            .map(DatasourceStructure.Table::getName)
                            .map(String::toLowerCase)
                            .collect(Collectors.toSet());

                    assertTrue(
                            setOfAllTableNames.equals(Set.of("dbo.supplier", "dbo.products")),
                            setOfAllTableNames.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testDBSchemaShowsAllColumnsAndTypesInATable() {
        Mono<DatasourceStructure> datasourceStructureMono =
                mssqlPluginExecutor.getStructure(sharedConnectionPool, createDatasourceConfiguration(container));

        StepVerifier.create(datasourceStructureMono)
                .assertNext(datasourceStructure -> {
                    Optional<DatasourceStructure.Table> supplierTable = datasourceStructure.getTables().stream()
                            .filter(table -> "dbo.supplier".equalsIgnoreCase(table.getName()))
                            .findFirst();

                    assertTrue(supplierTable.isPresent(), "supplier table not found in DB schema");

                    Set<String> allColumnNames = supplierTable.get().getColumns().stream()
                            .map(DatasourceStructure.Column::getName)
                            .map(String::toLowerCase)
                            .collect(Collectors.toSet());
                    Set<String> expectedColumnNames = Set.of("supplier_id", "supplier_name", "contact_name");
                    assertEquals(expectedColumnNames, allColumnNames, allColumnNames.toString());

                    supplierTable.get().getColumns().forEach(column -> {
                        String columnName = column.getName().toLowerCase();
                        String columnType = column.getType().toLowerCase();
                        String expectedColumnType;

                        if ("supplier_id".equals(columnName)) {
                            expectedColumnType = "int";
                        } else {
                            expectedColumnType = "varchar";
                        }

                        assertEquals(expectedColumnType, columnType, columnType);
                    });
                })
                .verifyComplete();
    }

    @Test
    public void testDynamicSqlTemplateQueriesForATable() {
        Mono<DatasourceStructure> datasourceStructureMono =
                mssqlPluginExecutor.getStructure(sharedConnectionPool, createDatasourceConfiguration(container));

        StepVerifier.create(datasourceStructureMono)
                .assertNext(datasourceStructure -> {
                    Optional<DatasourceStructure.Table> supplierTable = datasourceStructure.getTables().stream()
                            .filter(table -> "dbo.supplier".equalsIgnoreCase(table.getName()))
                            .findFirst();

                    assertTrue(supplierTable.isPresent(), "supplier table not found in DB schema");

                    supplierTable.get().getTemplates().stream()
                            .filter(template -> "select".equalsIgnoreCase(template.getTitle())
                                    || "delete".equalsIgnoreCase(template.getTitle()))
                            .forEach(template -> {

                                /*
                                 * Not sure how to test query templates for insert and update queries as these
                                 * queries include column names in an order that is not fixed. Hence, skipping testing
                                 * them for now.
                                 */

                                String expectedQueryTemplate = null;
                                if ("select".equalsIgnoreCase(template.getTitle())) {
                                    expectedQueryTemplate = "select top 10 * from dbo.supplier";
                                } else if ("delete".equalsIgnoreCase(template.getTitle())) {
                                    expectedQueryTemplate = "delete from dbo.supplier where 1=0 -- specify a valid"
                                            + " condition here. removing the condition may delete everything in the "
                                            + "table!";
                                }

                                String templateQuery = template.getBody();
                                assertEquals(
                                        expectedQueryTemplate,
                                        templateQuery.toLowerCase(),
                                        templateQuery.toLowerCase());
                            });
                })
                .verifyComplete();
    }

    private static void createTablesForTest() throws SQLException {
        runSQLQueryOnMssqlTestDB(SQL_QUERY_TO_CREATE_TABLE_WITH_PRIMARY_KEY, sharedConnectionPool);
        runSQLQueryOnMssqlTestDB(SQL_QUERY_TO_CREATE_TABLE_WITH_FOREIGN_KEY, sharedConnectionPool);
    }
}
