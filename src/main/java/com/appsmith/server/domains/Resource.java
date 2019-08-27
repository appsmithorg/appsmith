package com.appsmith.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Resource extends BaseDomain {
    @Indexed(unique = true)
    String name;

    @DBRef
    Plugin plugin;

    @DBRef
    Tenant tenant;

    ResourceConfiguration resourceConfiguration;

}
