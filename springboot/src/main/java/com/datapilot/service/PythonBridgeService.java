package com.datapilot.service;

import com.datapilot.model.UploadResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class PythonBridgeService {

    private static final Logger log = LoggerFactory.getLogger(PythonBridgeService.class);

    @Autowired
    private RestTemplate restTemplate;

    @Value("${python.service.url}")
    private String pythonUrl;

    public UploadResponse uploadFile(MultipartFile file) throws IOException {
        log.info("Forwarding upload to Python ML service: {}", file.getOriginalFilename());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", resource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<UploadResponse> response = restTemplate.exchange(
                    pythonUrl + "/upload",
                    HttpMethod.POST,
                    requestEntity,
                    UploadResponse.class
            );
            log.info("Upload OK — session: {}", response.getBody().getSessionId());
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("Python upload error: {}", e.getResponseBodyAsString());
            throw new RuntimeException("File processing failed: " + e.getMessage());
        } catch (ResourceAccessException e) {
            log.error("Cannot reach Python ML service at {}: {}", pythonUrl, e.getMessage());
            throw new RuntimeException("ML service unavailable. Make sure Python is running on port 8001.");
        }
    }

    public UploadResponse loadSample(String key) {
        log.info("Loading sample dataset: {}", key);
        try {
            ResponseEntity<UploadResponse> response = restTemplate.exchange(
                    pythonUrl + "/sample/" + key,
                    HttpMethod.GET,
                    null,
                    UploadResponse.class
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new RuntimeException("Sample not found: " + key);
        } catch (ResourceAccessException e) {
            throw new RuntimeException("ML service unavailable. Make sure Python is running on port 8001.");
        }
    }

    public boolean isPythonHealthy() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(pythonUrl + "/health", Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Python health check failed: {}", e.getMessage());
            return false;
        }
    }
}
