package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TemplateUploadDTO {
    ApplicationTemplate applicationTemplate;
    ApplicationJson appJson;
    String sourceApplicationId;
}
