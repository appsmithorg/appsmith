package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class Connection implements AppsmithDomain {

    public enum Mode {
        READ_ONLY,
        READ_WRITE
    }

    public enum Type {
        DIRECT,
        REPLICA_SET
    }

    Mode mode;

    Type type;

    SSLDetails ssl;

    String defaultDatabaseName;
}
