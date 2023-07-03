package com.appsmith.server.dtos;

import com.appsmith.external.models.BaseDomain;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Builder
public class PagedDomain<T> {
    List<T> content = new ArrayList<>();
    long count;
    long startIndex;
    long total;

    public PagedDomain(List<T> content, long count, long startIndex, long total) {
        this.content.addAll(content);
        this.count = count;
        this.startIndex = startIndex;
        this.total = total;
    }
}