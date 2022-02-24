package com.appsmith.server.dtos;

import com.appsmith.server.domains.Application;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ApplicationPagesDTO {

    String organizationId;

    Application application;

    List<PageNameIdDTO> pages;

}
