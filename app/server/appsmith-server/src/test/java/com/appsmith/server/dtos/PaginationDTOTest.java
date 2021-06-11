package com.appsmith.server.dtos;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PaginationDTOTest {

    @Test
    void getTotalPage() {
        PaginationDTO paginationDTO = new PaginationDTO(0, 10, 100);
        assertEquals(10, paginationDTO.getTotalPage());

        paginationDTO = new PaginationDTO(0, 10, 101);
        assertEquals(11, paginationDTO.getTotalPage());

        paginationDTO = new PaginationDTO(0, 10, 99);
        assertEquals(10, paginationDTO.getTotalPage());

        paginationDTO = new PaginationDTO(0, 10, 0);
        assertEquals(0, paginationDTO.getTotalPage());
    }
}