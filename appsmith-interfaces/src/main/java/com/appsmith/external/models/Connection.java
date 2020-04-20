package com.appsmith.external.models;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Connection {

    public enum Mode {
        READ_ONLY, READ_WRITE
    }

    public enum Type {
        DIRECT, REPLICA_SET
    }

    Mode mode;

    Type type;

    SSLDetails ssl;
}
