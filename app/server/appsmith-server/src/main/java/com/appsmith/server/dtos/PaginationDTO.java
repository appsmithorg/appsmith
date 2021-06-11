package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class PaginationDTO {
    private int currentPage;
    private int pageSize;
    private long totalCount;

    public long getTotalPage() {
        if((totalCount % pageSize) == 0) {
            return totalCount/pageSize;
        } else {
            return (totalCount/pageSize) + 1;
        }
    }
}
