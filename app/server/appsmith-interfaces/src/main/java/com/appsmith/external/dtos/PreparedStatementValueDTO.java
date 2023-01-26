package com.appsmith.external.dtos;

import com.appsmith.external.constants.DataType;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PreparedStatementValueDTO {

    @JsonView(Views.Public.class)
    String value;

    @JsonView(Views.Public.class)
    DataType dataType;
}
