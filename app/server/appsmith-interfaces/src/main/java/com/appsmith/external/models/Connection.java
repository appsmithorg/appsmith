package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonView;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Document
public class Connection implements AppsmithDomain {

    public enum Mode {
        READ_ONLY, READ_WRITE
    }

    public enum Type {
        DIRECT, REPLICA_SET
    }

    @JsonView(Views.Api.class)
    Mode mode;

    @JsonView(Views.Api.class)
    Type type;

    @JsonView(Views.Api.class)
    SSLDetails ssl;

    @JsonView(Views.Api.class)
    String defaultDatabaseName;
}
