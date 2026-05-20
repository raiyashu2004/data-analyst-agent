package com.datapilot.controller;

import com.datapilot.model.ApiResponse;
import com.datapilot.service.PythonBridgeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @Autowired
    private PythonBridgeService pythonBridgeService;

    @GetMapping("/health")
    public ApiResponse<Map<String, Object>> health() {
        boolean pythonUp = pythonBridgeService.isPythonHealthy();
        return ApiResponse.ok(Map.of(
                "gateway", "running",
                "gateway_port", 8080,
                "python_service", pythonUp ? "up" : "down",
                "python_port", 8001,
                "timestamp", LocalDateTime.now().toString(),
                "version", "2.0.0"
        ));
    }

    @GetMapping("/")
    public ApiResponse<String> root() {
        return ApiResponse.ok("Data Pilot Gateway — Spring Boot API Gateway");
    }
}
