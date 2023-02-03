package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

@Data
public class GitCheckoutBranchDTO {

    @JsonView(Views.Public.class)
    Boolean isRemote;

}
