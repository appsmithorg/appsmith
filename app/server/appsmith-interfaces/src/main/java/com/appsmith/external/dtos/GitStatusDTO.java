package com.appsmith.external.dtos;

import com.appsmith.external.dtos.ce.GitStatusCE_DTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * DTO to convey the status local git repo
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class GitStatusDTO extends GitStatusCE_DTO {}
