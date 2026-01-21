package com.example.fashionfriends.controller;

import com.example.fashionfriends.domain.Clothes;
import com.example.fashionfriends.domain.Member;
import com.example.fashionfriends.repository.MemberRepository;
import com.example.fashionfriends.service.ClosetService;
import com.example.fashionfriends.service.ImageService; // [필수]
import com.example.fashionfriends.service.OpenAiService; // [필수]
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/closet")
public class ClosetController {

    @Autowired
    private ClosetService closetService;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private ImageService imageService;

    @Autowired
    private OpenAiService openAiService;
    @PostMapping
    public Clothes addClothes(@RequestBody Map<String, Object> payload) {
        Long memberId = Long.valueOf(String.valueOf(payload.get("memberId")));
        Member owner = memberRepository.findById(memberId).orElse(null);

        // 1. 이미지 처리
        String originalImage = (String) payload.get("imageUrl");
        String cleanImage = originalImage;
        if (originalImage != null && originalImage.startsWith("data:image")) {
            cleanImage = imageService.removeBackground(originalImage);
        }

        String inputCategory = (String) payload.get("category");
        String inputName = (String) payload.get("name");
        String inputColor = (String) payload.get("color"); // 프론트엔드에선 안 보내므로 null임

        String aiStyle = null;
        String aiMaterial = null;

        //  카테고리 상관없이, '색상'이 없으면 무조건 AI 분석 실행
        if (inputColor == null || inputColor.isEmpty()) {
            System.out.println(" 옷 정밀 분석 시작... (색상/재질/스타일)");

            try {
                // Vision AI 호출
                Map<String, String> analysis = openAiService.analyzeClothing(cleanImage);

                // AI가 분석한 내용 채우기
                inputColor = analysis.get("color");
                aiStyle = analysis.get("style");
                aiMaterial = analysis.get("material");

                // 이름이 비어있으면 AI가 지어준 이름 사용
                if (inputName == null || inputName.isEmpty()) {
                    inputName = analysis.get("name");
                }

                System.out.println(" 분석 완료: " + inputColor + " / " + aiStyle);
            } catch (Exception e) {
                System.out.println(" AI 분석 실패: " + e.getMessage());
                inputColor = "MULTI"; // 실패 시 기본값
            }
        }

        // 3. 저장
        Clothes clothes = new Clothes();
        clothes.setMember(owner); // 주인 ID 저장
        clothes.setCategory(inputCategory); // 사용자가 선택한 카테고리 유지
        clothes.setName(inputName);
        clothes.setColor(inputColor);       // AI가 찾은 색상
        clothes.setStyle(aiStyle);          // AI가 찾은 스타일
        clothes.setMaterial(aiMaterial);    // AI가 찾은 재질
        clothes.setImageUrl(cleanImage);

        return closetService.addClothes(clothes);
    }
    // 내 옷장 조회
    @GetMapping("/{memberId}")
    public List<Clothes> getMyCloset(@PathVariable Long memberId) {
        return closetService.getMyCloset(memberId);
    }

    // 옷 수정
    @PutMapping("/{id}")
    public Clothes updateClothes(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String newCategory = payload.get("category");
        return closetService.updateClothes(id, newCategory);
    }

    // 옷 삭제
    @DeleteMapping("/{id}")
    public void deleteClothes(@PathVariable Long id) {
        closetService.deleteClothes(id);
    }
}