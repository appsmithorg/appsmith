package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.TenantConfigurationCE;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

@Data
@EqualsAndHashCode(callSuper = true)
public class TenantConfiguration extends TenantConfigurationCE implements Serializable {}
