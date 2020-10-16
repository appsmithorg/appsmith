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
    public static class Column implements Comparable<Column> {
        String name;
        String type;
        String defaultValue;

        @Override
        public int compareTo(Column other) {
            if (other == null || other.getName() == null) {
                return 1;
            }

            return name.compareTo(other.getName());
        }
    }

    public interface Key extends Comparable<Key> {
        String getType();

        @Override
        default int compareTo(Key other) {
            if (this instanceof PrimaryKey && other instanceof ForeignKey) {
                return -1;
            } else if (this instanceof ForeignKey && other instanceof PrimaryKey) {
                return 1;
            } else if (this instanceof PrimaryKey && other instanceof PrimaryKey) {
                final PrimaryKey thisKey = (PrimaryKey) this;
                final PrimaryKey otherKey = (PrimaryKey) other;
                if (thisKey.getName() != null && otherKey.getName() != null) {
                    return thisKey.getName().compareTo(otherKey.getName());
                } else if (thisKey.getName() == null) {
                    return 1;
                } else {
                    return -1;
                }
            }

            return 0;
        }
    }

    @Data
    @AllArgsConstructor
    public static class PrimaryKey implements Key {
        String name;
        List<String> columnNames;
        public String getType() {
            return "primary key";
        }
    }

    @Data
    @AllArgsConstructor
    public static class ForeignKey implements Key {
        String name;
        List<String> fromColumns;
        List<String> toColumns;
        public String getType() {
            return "foreign key";
        }
    }

    @Data
    @AllArgsConstructor
    public static class Template {
        String title;
        String body;
    }

}
