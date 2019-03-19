package com.mobtools.server.domains;

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
public class Tenant extends BaseDomain {

    private String domain;

    private String name;

    private String website;

}
