package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Arn {

    String base = "arn:appsmith";

    String organizationId;

    String entity;

    String entityId;

    @Override
    public String toString() {
        return base + ":" + organizationId + ":" + entity + ":" + entityId;
    }
}
