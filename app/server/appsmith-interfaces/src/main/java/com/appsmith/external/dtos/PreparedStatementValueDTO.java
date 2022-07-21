package com.appsmith.external.dtos;

import com.appsmith.external.constants.DataType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PreparedStatementValueDTO {

    String value;

    DataType dataType;
}
