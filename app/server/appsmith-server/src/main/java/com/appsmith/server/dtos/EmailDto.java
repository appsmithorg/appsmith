package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.AllArgsConstructor;
import lombok.Data;


@Data
@AllArgsConstructor
public class EmailDto {

    @JsonView(Views.Public.class)
    String subject;

    @JsonView(Views.Public.class)
    String emailTemplate;
}
