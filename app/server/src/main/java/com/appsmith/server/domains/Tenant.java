package com.appsmith.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.validation.constraints.NotNull;
import java.util.List;


@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Tenant extends BaseDomain {

    private String domain;

    @NotNull
    private String name;

    private String website;

    private List<TenantSetting> tenantSettings;

    private List<TenantPlugin> plugins;

}
