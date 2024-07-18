package com.appsmith.server.bbhack;

import com.appsmith.server.dtos.BBMainDTO;
import com.appsmith.server.dtos.BBResponseDTO;
import com.appsmith.server.repositories.BBHackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BBServiceImpl implements BBService {
    private final BBHackRepository repository;

    @Override
    public Mono<BBResponseDTO> createCustomBuildingBlock(BBMainDTO bbMainDTO) {
        return null;
    }

    @Override
    public Mono<List<BBResponseDTO>> fetchAllBuildingBlocks(String workspaceId) {
        return null;
    }
}
