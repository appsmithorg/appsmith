package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.TenantConfigurationCE;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Deprecated
@Data
@EqualsAndHashCode(callSuper = true)
public class TenantConfiguration extends TenantConfigurationCE {}
