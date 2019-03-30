package com.mobtools.server.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CommandQueryParams {
    List<Param> queryParams;

    List<Param> headerParams;
}
