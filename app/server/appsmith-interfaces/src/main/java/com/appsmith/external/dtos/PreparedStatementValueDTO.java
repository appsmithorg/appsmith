package com.appsmith.external.dtos;

import com.appsmith.external.datatypes.AppsmithType;
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

    AppsmithType dataType;
}
