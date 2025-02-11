package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.TenantConfigurationCE;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.FieldNameConstants;

@Data
@EqualsAndHashCode(callSuper = true)
@FieldNameConstants
public class TenantConfiguration extends TenantConfigurationCE {
    public static class Fields extends TenantConfigurationCE.Fields {}
}
