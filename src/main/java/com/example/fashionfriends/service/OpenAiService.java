package com.example.fashionfriends.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenAiService {

    private static final String API_KEY = ""; // 본인 키
    private static final String API_URL = "https://api.groq.com/openai/v1/chat/completions";

    // 1. 옷 분석 (Vision AI)
    @SuppressWarnings("unchecked")
    public Map<String, String> analyzeClothing(String base64Image) {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + API_KEY);

        String prompt = "Analyze this clothing image and return a JSON object with exactly these 5 fields:\n" +
                "1. \"color\": Main color of cloth (e.g., BLACK, WHITE, NAVY, BEIGE).\n" +
                "2. \"category\": Category (Choose one: 아우터, 상의, 하의, 신발, 목도리, 악세서리).\n" +
                "3. \"name\": Short descriptive name in Korean (e.g., 검정 롱패딩, 베이지 니트).\n" +
                "4. \"style\": Style mood (Choose one: CASUAL, FORMAL, STREET, SPORTY, MINIMAL, LOVELY).\n" +
                "5. \"material\": Texture or pattern (e.g., DENIM, KNIT, COTTON, LEATHER, CHECK, STRIPE, WASHING).\n" +
                "IMPORTANT: Output ONLY the JSON string. Do not use markdown code blocks.";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "meta-llama/llama-4-scout-17b-16e-instruct");
        requestBody.put("temperature", 0.1);
        requestBody.put("max_tokens", 300);
        if (!base64Image.startsWith("data:image")) {
            base64Image = "data:image/jpeg;base64," + base64Image;
        }
        List<Map<String, Object>> contentList = List.of(
                Map.of("type", "text", "text", prompt),
                Map.of("type", "image_url", "image_url", Map.of("url", base64Image))
        );

        requestBody.put("messages", List.of(
                Map.of("role", "user", "content", contentList)
        ));

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(API_URL, entity, Map.class);

            Map<String, Object> body = response.getBody();
            List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = (String) message.get("content");

            System.out.println(" AI 원본 응답: " + content);

            int jsonStart = content.indexOf("{");
            int jsonEnd = content.lastIndexOf("}");
            if (jsonStart != -1 && jsonEnd != -1) {
                content = content.substring(jsonStart, jsonEnd + 1);
            }
            return new ObjectMapper().readValue(content, new TypeReference<Map<String, String>>() {});

        } catch (Exception e) {
            e.printStackTrace();
            System.out.println(" 분석 실패: " + e.getMessage());
            Map<String, String> fallback = new HashMap<>();
            fallback.put("color", "WHITE");
            fallback.put("category", "아우터");
            fallback.put("name", "새 옷");
            fallback.put("style", "CASUAL");
            fallback.put("material", "COTTON");
            return fallback;
        }
    }

    // 2. 코디 추천 (Text AI) - 파라미터 추가 및 프롬프트 업그레이드
    @SuppressWarnings("unchecked")
    public Map<String, Object> getRecommendation(String closetData, String weather, String baseItemInfo, String userPrompt) {
        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + API_KEY);

        // 풀 착장 구성을 위한 강력한 프롬프트
        String prompt = "너는 전문 패션 스타일리스트야. 사용자의 옷장 데이터를 보고 오늘 날씨(" + weather + ")에 완벽한 '풀 착장(Full Outfit)'을 만들어줘.\n" +
                "\n" +
                "### 1. 사용자 옷장 ###\n" + closetData + "\n\n" +
                "### 2. 날씨 ###\n" + weather + "\n\n" +
                "### 3. 고정 아이템 (필수 포함) ###\n" + baseItemInfo + "\n\n" +
                "### 4. 사용자 요청사항 (★ 중요 ★) ###\n" +
                (userPrompt.isEmpty() ? "없음 (TPO에 맞게 알아서 추천해줘)" : userPrompt) + "\n\n" +
                "### 미션 및 제약조건 ###\n" +
                "1. [필수] 사용자가 '기준 아이템'을 선택했다면, 그 옷을 **무조건 포함**해서 코디를 완성해.\n" +
                "2. [구성] 가능한 한 **'아우터 + 상의 + 하의 + 신발'** 조합을 모두 갖춰줘. (옷장에 해당 카테고리가 없다면 생략 가능)\n" +
                "3. [중복 금지] 기준 아이템이 '상의'라면, 옷장에서 또 다른 '상의'를 추가하지 마. (겹치지 않게 나머지 카테고리만 채워)\n" +
                "4. [매칭] 색상(Color), 스타일(Style), 재질(Material)을 고려해서 어울리는 것들로 골라.\n" +
                "5. [출력] 결과는 오직 JSON 형식으로만 답해.\n" +
                "6. JSON 형식: {\"title\": \"코디 제목(짧고 멋지게)\", \"reason\": \"추천 이유(선택한 옷과 어떻게 어울리는지 설명)\", \"recommendedIds\": [최종 코디에 포함된 모든 옷의 ID 리스트 (기준 아이템 ID 포함)]}";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama-3.3-70b-versatile"); // 텍스트 추천용 모델
        requestBody.put("messages", List.of(
                Map.of("role", "system", "content", "You are a helpful fashion assistant. Respond only in JSON."),
                Map.of("role", "user", "content", prompt)
        ));
        requestBody.put("temperature", 0.6);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(API_URL, entity, Map.class);
            Map<String, Object> body = response.getBody();

            List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = (String) message.get("content");

            int jsonStart = content.indexOf("{");
            int jsonEnd = content.lastIndexOf("}");
            if (jsonStart != -1 && jsonEnd != -1) {
                content = content.substring(jsonStart, jsonEnd + 1);
            }

            return new ObjectMapper().readValue(content, new TypeReference<Map<String, Object>>() {});

        } catch (Exception e) {
            e.printStackTrace();
            return Map.of(
                    "title", "연결 실패 ",
                    "reason", "다시 시도해주세요.!",
                    "recommendedIds", List.of()
            );
        }
    }
}