/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos;

import com.appsmith.server.domains.Application;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApplicationPagesDTO {

String workspaceId;

Application application;

List<PageNameIdDTO> pages;
}
