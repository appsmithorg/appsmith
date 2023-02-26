package com.appsmith.server.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CommandQueryParams {
    List<OldParam> queryOldParams;

    List<OldParam> headerOldParams;
}
