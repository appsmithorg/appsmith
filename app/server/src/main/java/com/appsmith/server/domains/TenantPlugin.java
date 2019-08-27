package com.appsmith.server.domains;

import com.appsmith.server.dtos.TenantPluginStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.DBRef;

@Getter
@Setter
@ToString
@NoArgsConstructor
public class TenantPlugin extends BaseDomain {

    @DBRef
    private Plugin plugin;

    TenantPluginStatus status;

}
