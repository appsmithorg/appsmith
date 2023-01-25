package com.appsmith.server.dtos;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

@Data
public class GitCheckoutBranchDTO {

    @JsonView(Views.Api.class)
    Boolean isRemote;

}
