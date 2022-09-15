package com.appsmith.server.dtos;


import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.AllArgsConstructor;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class ErrorDTO {

    private String errorMessage;
    private Integer appErrorId;
    private String debuggerErrorMessage;


}
