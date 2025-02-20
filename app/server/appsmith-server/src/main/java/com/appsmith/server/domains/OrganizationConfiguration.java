package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.OrganizationConfigurationCE;
import jakarta.persistence.MappedSuperclass;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@MappedSuperclass
public class OrganizationConfiguration extends OrganizationConfigurationCE {}
