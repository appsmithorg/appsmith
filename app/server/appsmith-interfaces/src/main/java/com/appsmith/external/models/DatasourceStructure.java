package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class DatasourceStructure {

    List<Table> tables;

    public enum TableType {
        TABLE,
        VIEW,
        ALIAS,
        COLLECTION,
    }

    @Data
    @AllArgsConstructor
    public static class Table {
        TableType type;
        String name;
        List<Column> columns;
        List<Key> keys;
        List<Template> templates;
    }

    @Data
    @AllArgsConstructor
    public static class Column {
        String name;
        String type;
        String defaultValue;
    }

    public interface Key {
        String getType();
    }

    @Data
    @AllArgsConstructor
    public static class PrimaryKey implements Key {
        String name;
        List<String> columnNames;
        public String getType() {
            return "primary";
        }
    }

    @Data
    @AllArgsConstructor
    public static class ForeignKey implements Key {
        String name;
        List<String> fromColumns;
        List<String> toColumns;
        public String getType() {
            return "foreign";
        }
    }

    @Data
    @AllArgsConstructor
    public static class Template {
        String title;
        String body;
    }

}
