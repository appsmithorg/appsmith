package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
public class Arn implements Serializable {

    String base = "arn:appsmith";

    String organizationId;

    String entityName;

    String entityId;

    @Override
    public String toString() {
        return base + ":" + organizationId + ":" + entityName + ":" + entityId;
    }
}
