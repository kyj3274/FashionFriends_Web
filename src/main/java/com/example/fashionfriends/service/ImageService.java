package com.example.fashionfriends.service;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;

@Service
public class ImageService {


    // remove.bg 사이트에서 가입하고 받은 키 -> 배경 제거
    //
    private static final String API_KEY = "YOUR_REMOVE_BG_API_KEY";
    private static final String API_URL = "https://api.remove.bg/v1.0/removebg";

    public String removeBackground(String originalBase64) {
        // 1. 데이터가 없거나 Base64 형식이 아니면 그냥 원본 반환
        if (originalBase64 == null || !originalBase64.startsWith("data:image")) {
            return originalBase64;
        }

        try {
            RestTemplate restTemplate = new RestTemplate();

            // 2. 헤더 설정 (API 키)
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Api-Key", API_KEY);
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            // 3. Base64 -> 바이트 배열 변환
            String base64Image = originalBase64.split(",")[1];
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);

            // 4. 요청 본문 구성 (이미지 파일 첨부)
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image_file", new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() {
                    return "image.png";
                }
            });
            body.add("size", "auto");

            // 5. 전송 및 응답 받기
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    API_URL,
                    HttpMethod.POST,
                    requestEntity,
                    byte[].class
            );

            // 6. 성공하면 배경 제거된 이미지를 다시 Base64로 변환
            if (response.getStatusCode() == HttpStatus.OK) {
                byte[] resultBytes = response.getBody();
                return "data:image/png;base64," + Base64.getEncoder().encodeToString(resultBytes);
            }

        } catch (Exception e) {
            // API 키가 없거나 에러가 나면 로그만 남기고 원본 사진을 저장
            System.out.println("배경 제거 실패 (원본 저장): " + e.getMessage());
        }

        return originalBase64;
    }
}