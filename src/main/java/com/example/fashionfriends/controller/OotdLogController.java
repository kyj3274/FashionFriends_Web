package com.example.fashionfriends.controller;

import com.example.fashionfriends.domain.Member;
import com.example.fashionfriends.domain.OotdLog;
import com.example.fashionfriends.dto.OotdLogResponseDto;
import com.example.fashionfriends.repository.MemberRepository;
import com.example.fashionfriends.service.OotdLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.example.fashionfriends.service.SocialService;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/log")
public class OotdLogController {

    @Autowired
    private OotdLogService ootdLogService;

    @Autowired
    private MemberRepository memberRepository;
    @Autowired //
    private SocialService socialService;
    // 1. 기록 저장 (업로드)
    @PostMapping
    public OotdLog saveLog(@RequestBody Map<String, Object> payload) {
        // 사용자 찾기
        Long memberId = Long.valueOf(String.valueOf(payload.get("memberId")));
        Member writer = memberRepository.findById(memberId).orElse(null);

        // 기록 데이터 만들기
        OotdLog log = new OotdLog();
        log.setMember(writer);
        log.setDate(LocalDate.parse((String) payload.get("date")));
        log.setType((String) payload.get("type"));

        // 공개 여부 저장 (값이 없으면 false로 기본 설정하여 에러 방지)
        Boolean isPublic = (Boolean) payload.get("isPublic");
        log.setPublic(isPublic != null ? isPublic : false);

        log.setImageUrl((String) payload.get("imageUrl"));
        log.setComment((String) payload.get("comment"));

        // 옷 ID 리스트 저장 로직
        List<Integer> rawIds = (List<Integer>) payload.get("clothesIds");
        if (rawIds != null) {
            List<Long> longIds = rawIds.stream()
                    .map(id -> Long.valueOf(id))
                    .collect(Collectors.toList());
            log.setClothesIds(longIds);
        }

        return ootdLogService.saveLog(log);
    }

    // 2. 내 기록 조회
    @GetMapping("/{targetMemberId}")
    public List<OotdLogResponseDto> getMyLogs(
                                               @PathVariable Long targetMemberId,
                                               @RequestParam(required = false) Long myId
    ) {
        return ootdLogService.getMyLogs(targetMemberId, myId);
    }

    // 3. 홈 화면 피드
    @GetMapping("/feed")
    public List<OotdLogResponseDto> getHomeFeed(@RequestParam(required = false) Long myId) {
        return ootdLogService.getHomeFeed(myId);
    }

    // 4. 기록 삭제
    @DeleteMapping("/{id}")
    public void deleteLog(@PathVariable Long id) {
        ootdLogService.deleteLog(id);
    }
    // 5. 기록 수정 (캘린더/상세 화면에서 저장 버튼 클릭 시)
    // PUT /api/log/{id}
    @PutMapping("/{id}")
    public OotdLogResponseDto updateLog(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            @RequestParam(required = false) Long myId // myId를 받아야 DTO에 isLiked를 담을 수 있음
    ) {
        String comment = (String) payload.get("comment");
        Boolean isPublic = (Boolean) payload.get("isPublic");

        // Service 로직 호출 (Service는 OotdLog 엔티티 반환)
        OotdLog updatedLog = ootdLogService.updateLog(id, comment, isPublic);

        // 업데이트된 엔티티를 DTO로 변환
        boolean isLiked = (myId != null) ? socialService.isLogLiked(myId, updatedLog.getId()) : false;

        return new OotdLogResponseDto(updatedLog, isLiked);
    }
}