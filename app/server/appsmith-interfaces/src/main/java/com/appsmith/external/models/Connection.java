package com.appsmith.external.models;

import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
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

    @JsonView({Views.Public.class, FromRequest.class})
    SSLDetails ssl;

    String defaultDatabaseName;
}
