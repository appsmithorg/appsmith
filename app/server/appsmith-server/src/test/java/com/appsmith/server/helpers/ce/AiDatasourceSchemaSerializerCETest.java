package com.appsmith.server.helpers.ce;

import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Column;
import com.appsmith.external.models.DatasourceStructure.ForeignKey;
import com.appsmith.external.models.DatasourceStructure.PrimaryKey;
import com.appsmith.external.models.DatasourceStructure.Table;
import com.appsmith.external.models.DatasourceStructure.TableType;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class AiDatasourceSchemaSerializerCETest {

    @Test
    void isSqlPluginPackageName_recognizesPostgres() {
        assertThat(AiDatasourceSchemaSerializerCE.isSqlPluginPackageName("postgres-plugin"))
                .isTrue();
        assertThat(AiDatasourceSchemaSerializerCE.isSqlPluginPackageName("mongo-plugin"))
                .isFalse();
    }

    @Test
    void extractReferencedTableNames_findsNameInPrompt() {
        Set<String> names = AiDatasourceSchemaSerializerCE.extractReferencedTableNames(
                "Write a query for the orders table", List.of("users", "orders", "products"));
        assertThat(names).containsExactlyInAnyOrder("orders");
    }

    @Test
    void serializeForSqlPlugin_unionsPromptAndQuery() {
        DatasourceStructure structure = smallSchema();
        String out = AiDatasourceSchemaSerializerCE.serializeForSqlPlugin(
                structure, "join users to orders", "SELECT * FROM products", 50_000);
        assertThat(out).contains("TABLE users");
        assertThat(out).contains("TABLE orders");
        assertThat(out).contains("TABLE products");
    }

    @Test
    void serializeForSqlPlugin_whenNoMatches_fallsBackToAllTables() {
        DatasourceStructure structure = smallSchema();
        String out = AiDatasourceSchemaSerializerCE.serializeForSqlPlugin(structure, "", "", 50_000);
        assertThat(out).contains("TABLE users");
        assertThat(out).contains("TABLE orders");
        assertThat(out).contains("TABLE products");
    }

    @Test
    void serializeLegacy_prioritizesTablesFromQueryOnly() {
        DatasourceStructure structure = smallSchema();
        // Small budget forces tier 2; only `users` is referenced — not orders/products in full
        String out = AiDatasourceSchemaSerializerCE.serializeLegacy(structure, "SELECT * FROM users", 120);
        assertThat(out).contains("TABLE users");
        assertThat(out).contains("Other tables:");
        assertThat(out).doesNotContain("TABLE products (");
    }

    private static DatasourceStructure smallSchema() {
        Table users = new Table(
                TableType.TABLE,
                null,
                "users",
                List.of(new Column("id", "INTEGER", null, null)),
                List.of(new PrimaryKey("pk", List.of("id"))),
                null);
        Table orders = new Table(
                TableType.TABLE,
                null,
                "orders",
                List.of(new Column("id", "INTEGER", null, null), new Column("user_id", "INTEGER", null, null)),
                List.of(
                        new PrimaryKey("pk", List.of("id")),
                        new ForeignKey("fk", List.of("user_id"), List.of("users.id"))),
                null);
        Table products = new Table(
                TableType.TABLE,
                null,
                "products",
                List.of(new Column("id", "INTEGER", null, null)),
                List.of(new PrimaryKey("pk", List.of("id"))),
                null);
        return new DatasourceStructure(List.of(users, orders, products));
    }
}
