package com.datatwin;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {"python.service.url=http://localhost:8001"})
class DataTwinApplicationTests {

    @Test
    void contextLoads() {
        // Verifies Spring Boot context initializes correctly
    }
}
