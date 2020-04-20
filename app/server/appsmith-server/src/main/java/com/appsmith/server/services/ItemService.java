package com.appsmith.server.services;

import com.appsmith.server.domains.Action;
import com.appsmith.server.dtos.AddItemToPageDTO;
import com.appsmith.server.dtos.ItemDTO;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ItemService {
    Flux<ItemDTO> get(MultiValueMap<String, String> params);

    Mono<Action> addItemToPage(AddItemToPageDTO addItemToPageDTO);
}
