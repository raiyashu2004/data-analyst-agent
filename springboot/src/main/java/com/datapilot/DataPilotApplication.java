package com.datapilot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DataPilotApplication {
    public static void main(String[] args) {
        SpringApplication.run(DataPilotApplication.class, args);
        System.out.println("\n╔══════════════════════════════════════════╗");
        System.out.println("║   STRATEGOS Gateway   —  Spring Boot 3.2   ║");
        System.out.println("║   Gateway  →  http://localhost:8080       ║");
        System.out.println("║   ML Svc   →  http://localhost:8001       ║");
        System.out.println("║   Frontend →  http://localhost:3000       ║");
        System.out.println("╚══════════════════════════════════════════╝\n");
    }
}
