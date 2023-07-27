package com.external.plugins;

import com.appsmith.external.models.DatasourceStructure;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.OracleContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.sql.SQLException;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.external.helpers.PluginUtils.STRING_TYPE;
import static com.appsmith.external.helpers.PluginUtils.getDataValueSafelyFromFormData;
import static com.external.plugins.OracleTestDBContainerManager.getDefaultDatasourceConfig;
import static com.external.plugins.OracleTestDBContainerManager.oraclePluginExecutor;
import static com.external.plugins.OracleTestDBContainerManager.runSQLQueryOnOracleTestDB;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
public class OracleGetDBSchemaTest {
    public static final String SQL_QUERY_TO_CREATE_TABLE_WITH_PRIMARY_KEY =
            "CREATE TABLE supplier\n" + "( supplier_id numeric(10) not null,\n"
                    + "  supplier_name varchar2(50) not null,\n"
                    + "  contact_name varchar2(50),\n"
                    + "  CONSTRAINT supplier_pk PRIMARY KEY (supplier_id)\n"
                    + ")";

    public static final String SQL_QUERY_TO_CREATE_TABLE_WITH_FOREIGN_KEY =
            "CREATE TABLE products\n" + "( product_id numeric(10) not null,\n"
                    + "  supplier_id numeric(10) not null,\n"
                    + "  CONSTRAINT fk_supplier\n"
                    + "  FOREIGN KEY (supplier_id)\n"
                    + "  REFERENCES supplier(supplier_id)\n"
                    + ")";

    @SuppressWarnings("rawtypes") // The type parameter for the container type is just itself and is pseudo-optional.
    @Container
    private static final OracleContainer oracleDB = OracleTestDBContainerManager.getOracleDBForTest();

    private static HikariDataSource sharedConnectionPool = null;

    @BeforeAll
    public static void setup() throws SQLException {
        sharedConnectionPool = oraclePluginExecutor
                .datasourceCreate(getDefaultDatasourceConfig(oracleDB))
                .block();
        createTablesForTest();
    }

    private static void createTablesForTest() throws SQLException {
        runSQLQueryOnOracleTestDB(SQL_QUERY_TO_CREATE_TABLE_WITH_PRIMARY_KEY, sharedConnectionPool);
        runSQLQueryOnOracleTestDB(SQL_QUERY_TO_CREATE_TABLE_WITH_FOREIGN_KEY, sharedConnectionPool);
    }

    @Test
    public void testDBSchemaShowsAllTables() {
        Mono<DatasourceStructure> datasourceStructureMono =
                oraclePluginExecutor.getStructure(sharedConnectionPool, getDefaultDatasourceConfig(oracleDB));

        StepVerifier.create(datasourceStructureMono)
                .assertNext(datasourceStructure -> {
                    Set<String> setOfAllTableNames = datasourceStructure.getTables().stream()
                            .map(DatasourceStructure.Table::getName)
                            .map(String::toLowerCase)
                            .collect(Collectors.toSet());

                    assertTrue(
                            setOfAllTableNames.equals(Set.of("supplier", "products")), setOfAllTableNames.toString());
                })
                .verifyComplete();
    }

    @Test
    public void testDBSchemaShowsAllColumnsAndTypesInATable() {
        Mono<DatasourceStructure> datasourceStructureMono =
                oraclePluginExecutor.getStructure(sharedConnectionPool, getDefaultDatasourceConfig(oracleDB));

        StepVerifier.create(datasourceStructureMono)
                .assertNext(datasourceStructure -> {
                    DatasourceStructure.Table supplierTable = datasourceStructure.getTables().stream()
                            .filter(table -> "supplier".equalsIgnoreCase(table.getName()))
                            .findFirst()
                            .get();

                    assertTrue(supplierTable != null, "supplier table not found in DB schema");

                    Set<String> allColumnNames = supplierTable.getColumns().stream()
                            .map(DatasourceStructure.Column::getName)
                            .map(String::toLowerCase)
                            .collect(Collectors.toSet());
                    Set<String> expectedColumnNames = Set.of("supplier_id", "supplier_name", "contact_name");
                    assertEquals(expectedColumnNames, allColumnNames, allColumnNames.toString());

                    supplierTable.getColumns().stream().forEach(column -> {
                        String columnName = column.getName().toLowerCase();
                        String columnType = column.getType().toLowerCase();
                        String expectedColumnType = null;

                        if ("supplier_id".equals(columnName)) {
                            expectedColumnType = "number";
                        } else {
                            expectedColumnType = "varchar2";
                        }

                        assertEquals(expectedColumnType, columnType, columnType);
                    });
                })
                .verifyComplete();
    }

    @Test
    public void testDynamicSqlTemplateQueriesForATable() {
        Mono<DatasourceStructure> datasourceStructureMono =
                oraclePluginExecutor.getStructure(sharedConnectionPool, getDefaultDatasourceConfig(oracleDB));

        StepVerifier.create(datasourceStructureMono)
                .assertNext(datasourceStructure -> {
                    DatasourceStructure.Table supplierTable = datasourceStructure.getTables().stream()
                            .filter(table -> "supplier".equalsIgnoreCase(table.getName()))
                            .findFirst()
                            .get();

                    assertTrue(supplierTable != null, "supplier table not found in DB schema");

                    supplierTable.getTemplates().stream()
                            .filter(template -> "select".equalsIgnoreCase(template.getTitle())
                                    || "delete".equalsIgnoreCase(template.getTitle()))
                            .forEach(template -> {
                                /**
                                 * Not sure how to test query templates for insert and update queries as these
                                 * queries include column names in an order that is not fixed. Hence, skipping testing
                                 * them for now.
                                 */
                                String expectedSelectQueryTemplate = null;
                                if ("select".equalsIgnoreCase(template.getTitle())) {
                                    expectedSelectQueryTemplate = "select * from supplier where rownum < 10";
                                } else if ("delete".equalsIgnoreCase(template.getTitle())) {
                                    expectedSelectQueryTemplate = "delete from supplier where 1=0 -- specify a valid"
                                            + " condition here. removing the condition may delete everything in the "
                                            + "table!";
                                }

                                String templateQuery = getDataValueSafelyFromFormData(
                                        (Map<String, Object>) template.getConfiguration(), "body", STRING_TYPE);
                                assertEquals(
                                        expectedSelectQueryTemplate,
                                        templateQuery.toLowerCase(),
                                        templateQuery.toLowerCase());
                            });
                })
                .verifyComplete();
    }
}
