package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ApplicationPagesDTO {

    String organizationId;

    List<PageNameIdDTO> pages;

}
