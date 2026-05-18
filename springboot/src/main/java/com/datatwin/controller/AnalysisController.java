package com.datatwin.controller;

import com.datatwin.model.ApiResponse;
import com.datatwin.model.UploadResponse;
import com.datatwin.service.PythonBridgeService;
import com.datatwin.service.SseProxyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AnalysisController {

    private static final Logger log = LoggerFactory.getLogger(AnalysisController.class);

    @Autowired
    private PythonBridgeService pythonBridgeService;

    @Autowired
    private SseProxyService sseProxyService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<UploadResponse>> uploadFile(
            @RequestParam("file") MultipartFile file) {

        log.info("File upload: {} ({} bytes)", file.getOriginalFilename(), file.getSize());

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("File is empty"));
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.matches(".*\\.(csv|xlsx|xls|json)$")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Unsupported format. Use CSV, Excel (.xlsx), or JSON."));
        }

        if (file.getSize() > 50L * 1024 * 1024) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File too large. Maximum 50MB."));
        }

        try {
            UploadResponse result = pythonBridgeService.uploadFile(file);
            return ResponseEntity.ok(ApiResponse.ok("File uploaded successfully", result));
        } catch (Exception e) {
            log.error("Upload failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/sample/{key}")
    public ResponseEntity<ApiResponse<UploadResponse>> loadSample(@PathVariable String key) {
        log.info("Loading sample: {}", key);

        if (!key.equals("sales") && !key.equals("students")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Unknown sample '" + key + "'. Use 'sales' or 'students'."));
        }

        try {
            UploadResponse result = pythonBridgeService.loadSample(key);

            if ("sales".equals(key)) {
                result.setSuggestedQuestion(
                    "What's causing the Q3 revenue decline and which products and regions are most affected?"
                );
            } else {
                result.setSuggestedQuestion(
                    "What factors most strongly predict student performance and who is at risk of failing?"
                );
            }

            return ResponseEntity.ok(ApiResponse.ok(result));
        } catch (Exception e) {
            log.error("Sample load failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping(value = "/analyze", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter analyze(
            @RequestParam("session_id") String sessionId,
            @RequestParam("question") String question,
            @RequestParam(value = "provider", defaultValue = "gemini") String provider) {

        log.info("Analyze — session: {}, provider: {}", sessionId, provider);

        if (sessionId == null || sessionId.isBlank()) {
            SseEmitter emitter = new SseEmitter();
            try {
                emitter.send("{\"type\":\"error\",\"message\":\"session_id is required\"}");
                emitter.complete();
            } catch (Exception ignored) {}
            return emitter;
        }

        return sseProxyService.streamAnalysis(sessionId, question, provider);
    }

    @GetMapping("/samples")
    public ApiResponse<List<Map<String, String>>> listSamples() {
        return ApiResponse.ok(List.of(
            Map.of("key", "sales", "label", "Sales Performance",
                   "description", "500 rows · revenue, products, regions, Q3 dip", "emoji", "📈"),
            Map.of("key", "students", "label", "Student Performance",
                   "description", "300 rows · scores, study hours, attendance", "emoji", "🎓")
        ));
    }
}
