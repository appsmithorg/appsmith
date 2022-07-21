package com.appsmith.server.services.ce;

import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.AddItemToPageDTO;
import com.appsmith.server.dtos.ItemDTO;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ItemServiceCE {

    Flux<ItemDTO> get(MultiValueMap<String, String> params);

    Mono<ActionDTO> addItemToPage(AddItemToPageDTO addItemToPageDTO);

}
