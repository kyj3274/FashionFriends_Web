package com.example.fashionfriends.controller;
import com.example.fashionfriends.domain.Notification;
import com.example.fashionfriends.service.SocialService;
import org.springframework.beans.factory.annotation.Autowired; // Lombok 없으면 사용
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/social")
public class SocialController {

    @Autowired
    private SocialService socialService;

    // 1. 좋아요 (Like = Heart 기능 통합)
    @PostMapping("/like")
    public ResponseEntity<?> toggleLike(@RequestBody Map<String, Long> params) {
        Long memberId = params.get("memberId"); // 누가
        Long logId = params.get("logId");       // 어떤 글에

        // 서비스 호출 -> DB 저장/삭제 및 LikeCount 증감 처리

        // 반환된 최신 좋아요 수를 받습니다.
        int newLikeCount = socialService.toggleLike(memberId, logId);
        boolean isLikedNow = socialService.isLogLiked(memberId, logId);
        // 응답에 likeCount를 포함하여 프론트엔드에 전달합니다.
        return ResponseEntity.ok(Map.of(
                "message", "성공",
                "isLiked", isLikedNow,
                "likeCount", newLikeCount
        ));
    }

    // 2. 팔로우 요청 (Ref 요청)
    @PostMapping("/follow")
    public ResponseEntity<?> requestFollow(@RequestBody Map<String, Long> params) {
        Long senderId = params.get("senderId");
        Long receiverId = params.get("receiverId");

        String result = socialService.requestFollow(senderId, receiverId);
        return ResponseEntity.ok(Map.of("status", result)); // REQUESTED, ALREADY, SELF 등
    }

    // 3. 프로필 조회 (Mates/Refs 카운트 포함)
    @GetMapping("/profile/{targetId}")
    public ResponseEntity<Map<String, Object>> getProfile(
            @PathVariable Long targetId,
            @RequestParam Long myId
    ) {
        // SocialService에 이미 만들어진 getMemberProfile 활용
        Map<String, Object> profileData = socialService.getMemberProfile(myId, targetId);
        return ResponseEntity.ok(profileData);
    }
    // 4. 알림 조회 (GET /api/social/notifications/{userId})
    @GetMapping("/notifications/{userId}")
    public ResponseEntity<?> getNotifications(@PathVariable Long userId) {
        // SocialService를 호출하여 알림 목록을 가져옵니다.
        List<Notification> notifications = socialService.getMyNotifications(userId);

        // DTO로 변환하는 것이 이상적이지만, 현재 프론트엔드 구조를 맞추기 위해 엔티티를 반환합니다.

        return ResponseEntity.ok(notifications);
    }
    // 5. 팔로우 응답 (POST /api/social/respond)
    @PostMapping("/respond")
    public ResponseEntity<?> respondFollow(@RequestBody Map<String, Object> params) {
        // JSON에서 Integer로 받아 Long으로 변환
        Long notificationId = Long.valueOf(String.valueOf(params.get("notificationId")));
        Boolean accept = (Boolean) params.get("accept");

        // SocialService를 호출하여 요청을 처리합니다.
        socialService.handleFollowRequest(notificationId, accept);

        // 처리 완료 후 알림 목록 갱신을 위해 프론트엔드에 성공 응답을 보냅니다.
        return ResponseEntity.ok(Map.of("message", "응답 처리 완료"));
    }
}