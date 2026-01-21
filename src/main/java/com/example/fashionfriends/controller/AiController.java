package com.example.fashionfriends.controller;

import com.example.fashionfriends.domain.Clothes;
import com.example.fashionfriends.repository.ClothesRepository;
import com.example.fashionfriends.service.OpenAiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private ClothesRepository clothesRepository;

    @Autowired
    private OpenAiService openAiService;

    @PostMapping("/recommend")
    public Map<String, Object> recommend(@RequestBody Map<String, Object> request) {
        Long memberId = Long.valueOf(String.valueOf(request.get("memberId")));

        // 1. 다중 선택된 옷 ID 리스트 받기
        List<Integer> selectedIds = (List<Integer>) request.get("clothesIds");

        // 2. 사용자 요청사항 받기 (없으면 빈 문자열)
        String userPrompt = (String) request.get("userPrompt");
        if (userPrompt == null) userPrompt = "";

        // 3. 내 옷장 데이터 가져오기
        List<Clothes> myCloset = clothesRepository.findByMemberId(memberId);
        if (myCloset.isEmpty()) {
            return Map.of("title", "옷장이 비었어요", "reason", "옷을 먼저 등록해주세요!", "recommendedItems", List.of());
        }

        // 4. 옷장 데이터 JSON 변환
        String closetJsonString = "";
        try {
            List<Map<String, Object>> simpleCloset = new ArrayList<>();
            for (Clothes c : myCloset) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", c.getId());
                item.put("category", c.getCategory());
                item.put("name", c.getName());
                item.put("color", c.getColor());
                item.put("style", c.getStyle());
                item.put("material", c.getMaterial());
                simpleCloset.add(item);
            }
            closetJsonString = new ObjectMapper().writeValueAsString(simpleCloset);
        } catch (Exception e) { e.printStackTrace(); }

        // 5. 기준 아이템 정보 만들기 (여러 개 처리)
        StringBuilder baseItemInfo = new StringBuilder();
        if (selectedIds != null && !selectedIds.isEmpty()) {
            baseItemInfo.append("사용자가 이미 고른 옷들 (이 옷들은 무조건 포함해):\n");
            for (Integer id : selectedIds) {
                Clothes base = clothesRepository.findById(Long.valueOf(id)).orElse(null);
                if (base != null) {
                    baseItemInfo.append(String.format("- ID:%d, %s (%s, %s)\n",
                            base.getId(), base.getName(), base.getCategory(), base.getColor()));
                }
            }
        } else {
            baseItemInfo.append("사용자가 선택한 옷 없음 (자유롭게 전체 코디 추천)");
        }

        String weather = (String) request.get("weather");
        System.out.println("AI 요청: " + userPrompt + " / 날씨: " + weather);


        // getRecommendation 메소드 파라미터가 4개여야 합니다! (closet, weather, baseInfo, userPrompt)
        Map<String, Object> aiResult = openAiService.getRecommendation(closetJsonString, weather, baseItemInfo.toString(), userPrompt);

        System.out.println("AI 응답: " + aiResult);

        // 7. 결과 매핑 (ID -> 실제 옷 객체 + 사진 URL)
        List<Integer> recommendedIds = (List<Integer>) aiResult.get("recommendedIds");
        List<Map<String, Object>> recommendedItems = new ArrayList<>();

        if (recommendedIds != null) {
            for (Integer id : recommendedIds) {
                Clothes item = clothesRepository.findById(Long.valueOf(id)).orElse(null);
                if (item != null) {
                    Map<String, Object> itemInfo = new HashMap<>();
                    itemInfo.put("id", item.getId());
                    itemInfo.put("name", item.getName());
                    itemInfo.put("category", item.getCategory());
                    itemInfo.put("imageUrl", item.getImageUrl());
                    recommendedItems.add(itemInfo);
                }
            }
        }

        Map<String, Object> finalResult = new HashMap<>(aiResult);
        finalResult.put("recommendedItems", recommendedItems);

        return finalResult;
    }
}