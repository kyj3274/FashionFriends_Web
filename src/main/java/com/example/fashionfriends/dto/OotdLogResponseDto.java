package com.example.fashionfriends.dto;

import com.example.fashionfriends.domain.OotdLog;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class OotdLogResponseDto {
    private Long id;

    // 게시물 상세 정보 및 캘린더 표시용
    private String imageUrl;
    private String comment;
    private LocalDate date;

    // 게시물 유형 및 공개 여부
    private String type;
    private boolean isPublic;

    // OOTD에 사용된 옷 ID 목록 (UI에서 옷 정보 조회용)
    private List<Long> clothesIds;

    // 좋아요 및 소셜 정보
    private int likeCount;
    private boolean isLiked; // 핵심: 내가 좋아요 눌렀는지 여부

    // 작성자 정보
    private Long memberId;
    private String nickname;
    private String profileImg;

    // 생성자에서 엔티티 -> DTO 변환 및 하트 여부 설정
    public OotdLogResponseDto(OotdLog log, boolean isLiked) {
        this.id = log.getId();
        this.imageUrl = log.getImageUrl();
        this.comment = log.getComment();
        this.date = log.getDate();

        // 추가된 필드 설정
        this.type = log.getType();
        this.isPublic = log.isPublic();
        this.clothesIds = log.getClothesIds(); // List<Long> 그대로 전달

        this.likeCount = log.getLikeCount();
        this.isLiked = isLiked;

        // 작성자 정보 설정
        this.memberId = log.getMember().getId();
        this.nickname = log.getMember().getNickname();
        this.profileImg = log.getMember().getProfileImg();
    }
}