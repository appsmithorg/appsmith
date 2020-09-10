package com.appsmith.external.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class DatasourceStructure {

    final List<Table> tables = new ArrayList<>();

    public enum TableType {
        TABLE,
        VIEW,
        ALIAS,
        COLLECTION,
    }

    @Data
    @RequiredArgsConstructor
    public static class Table {
        final TableType type;
        final String name;
        final List<Column> columns = new ArrayList<>();
        final List<Key> keys = new ArrayList<>();
        final List<Template> templates = new ArrayList<>();
    }

    @Data
    @RequiredArgsConstructor
    public static class Column {
        final String name;
        final String type;
        final String defaultValue;
    }

    public interface Key {
        String getType();
    }

    @Data
    @RequiredArgsConstructor
    public static class PrimaryKey implements Key {
        final String name;
        final List<String> columnNames = new ArrayList<>();
        public String getType() {
            return "primary";
        }
    }

    @Data
    @RequiredArgsConstructor
    public static class ForeignKey implements Key {
        final String name;
        final List<String> fromColumns = new ArrayList<>();
        final List<String> toColumns = new ArrayList<>();
        public String getType() {
            return "foreign";
        }
    }

    @Data
    @RequiredArgsConstructor
    public static class Template {
        final String title;
        final String body;
    }

}
