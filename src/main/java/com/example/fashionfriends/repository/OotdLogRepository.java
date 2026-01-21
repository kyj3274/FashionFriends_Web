package com.example.fashionfriends.repository;

import com.example.fashionfriends.domain.OotdLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OotdLogRepository extends JpaRepository<OotdLog, Long> {

    // 1. 특정 사용자의 기록만 다 가져오기 (마이페이지용)
    List<OotdLog> findByMemberId(Long memberId);

    // 2. 공개된(isPublic=true) 기록만 최신 날짜순으로 가져오기 (홈 화면 피드용)
    List<OotdLog> findByIsPublicTrueOrderByDateDesc();
}