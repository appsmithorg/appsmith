package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.OrganizationConfigurationCE;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.FieldNameConstants;

@Data
@EqualsAndHashCode(callSuper = true)
@FieldNameConstants
public class OrganizationConfiguration extends OrganizationConfigurationCE {
    public static class Fields extends OrganizationConfigurationCE.Fields {}
}
