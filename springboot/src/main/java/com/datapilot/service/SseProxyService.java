package com.datapilot.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class SseProxyService {

    private static final Logger log = LoggerFactory.getLogger(SseProxyService.class);

    @Value("${python.service.url}")
    private String pythonUrl;

    public SseEmitter streamAnalysis(String sessionId, String question, String provider) {
        SseEmitter emitter = new SseEmitter(120_000L);

        Thread proxyThread = new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                String encodedQuestion = URLEncoder.encode(question, StandardCharsets.UTF_8);
                String urlStr = pythonUrl + "/analyze"
                        + "?session_id=" + sessionId
                        + "&question=" + encodedQuestion
                        + "&provider=" + provider;

                log.debug("Proxying SSE from Python: {}", urlStr);

                URL url = new URL(urlStr);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("Accept", "text/event-stream");
                conn.setRequestProperty("Cache-Control", "no-cache");
                conn.setConnectTimeout(10_000);
                conn.setReadTimeout(120_000);
                conn.connect();

                int status = conn.getResponseCode();
                if (status != 200) {
                    emitter.send(SseEmitter.event()
                            .data("{\"type\":\"error\",\"message\":\"ML service error: HTTP " + status + "\"}"));
                    emitter.complete();
                    return;
                }

                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (line.startsWith("data: ")) {
                            String data = line.substring(6);
                            emitter.send(SseEmitter.event().data(data));
                            if (data.contains("\"type\":\"end\"")) break;
                        }
                    }
                }

                emitter.complete();

            } catch (Exception e) {
                log.error("SSE proxy error: {}", e.getMessage());
                try {
                    emitter.send(SseEmitter.event()
                            .data("{\"type\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}"));
                } catch (Exception ignored) {}
                emitter.completeWithError(e);
            } finally {
                if (conn != null) conn.disconnect();
            }
        });

        proxyThread.setDaemon(true);
        proxyThread.setName("sse-proxy-" + sessionId.substring(0, 8));
        proxyThread.start();

        emitter.onTimeout(emitter::complete);
        emitter.onError(e -> log.warn("SSE emitter error: {}", e.getMessage()));

        return emitter;
    }
}
