package com.appsmith.server.bbhack;

import com.appsmith.server.domains.BuildingBlockHack;
import com.appsmith.server.dtos.BBMainDTO;
import com.appsmith.server.dtos.BBResponseDTO;
import com.appsmith.server.repositories.BBHackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BBServiceImpl implements BBService {
    private final BBHackRepository repository;

    private BuildingBlockHack constructBBDomainFromDTO(BBMainDTO bbMainDTO) {
        BuildingBlockHack buildingBlock = new BuildingBlockHack();
        buildingBlock.setIcon(bbMainDTO.getIcon());
        buildingBlock.setName(bbMainDTO.getName());
        buildingBlock.setDsl(bbMainDTO.getDsl());

        return buildingBlock;
    }

    private BBMainDTO prepareDTOFromDomain(BuildingBlockHack buildingBlockHack) {
        BBMainDTO bbMainDTO = new BBMainDTO();
        bbMainDTO.setId(buildingBlockHack.getId());
        bbMainDTO.setName(buildingBlockHack.getName());
        bbMainDTO.setDsl(buildingBlockHack.getDsl());
        bbMainDTO.setIcon(buildingBlockHack.getIcon());
        return bbMainDTO;
    }

    @Override
    public Mono<BBResponseDTO> createCustomBuildingBlock(BBMainDTO bbMainDTO) {
        return repository.save(constructBBDomainFromDTO(bbMainDTO)).flatMap(savedBB -> {
            BBResponseDTO bbResponseDTO = new BBResponseDTO();
            bbMainDTO.setId(savedBB.getId());
            bbResponseDTO.setBb(bbMainDTO);
            return Mono.just(bbResponseDTO);
        });
    }

    @Override
    public Mono<List<BBResponseDTO>> fetchAllBuildingBlocks() {
        return repository.findAll().collectList().flatMap(bbs -> {
            List<BBResponseDTO> bbResponseDTOS = new ArrayList<>();
            bbs.forEach(bb -> {
                BBResponseDTO bbResponseDTO = new BBResponseDTO();
                bbResponseDTO.setBb(prepareDTOFromDomain(bb));

                bbResponseDTOS.add(bbResponseDTO);
            });
            return Mono.just(bbResponseDTOS);
        });
    }
}
