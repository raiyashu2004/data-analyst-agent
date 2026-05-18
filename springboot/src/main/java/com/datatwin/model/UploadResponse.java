package com.datatwin.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class UploadResponse {

    @JsonProperty("session_id")
    private String sessionId;

    private String filename;
    private Map<String, Integer> shape;
    private List<ColumnInfo> columns;
    private List<Map<String, Object>> head;

    @JsonProperty("_suggestedQ")
    private String suggestedQuestion;

    public UploadResponse() {}

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    public Map<String, Integer> getShape() { return shape; }
    public void setShape(Map<String, Integer> shape) { this.shape = shape; }
    public List<ColumnInfo> getColumns() { return columns; }
    public void setColumns(List<ColumnInfo> columns) { this.columns = columns; }
    public List<Map<String, Object>> getHead() { return head; }
    public void setHead(List<Map<String, Object>> head) { this.head = head; }
    public String getSuggestedQuestion() { return suggestedQuestion; }
    public void setSuggestedQuestion(String suggestedQuestion) { this.suggestedQuestion = suggestedQuestion; }

    public static class ColumnInfo {
        private String name;
        private String dtype;
        private List<String> sample;

        public ColumnInfo() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDtype() { return dtype; }
        public void setDtype(String dtype) { this.dtype = dtype; }
        public List<String> getSample() { return sample; }
        public void setSample(List<String> sample) { this.sample = sample; }
    }
}
