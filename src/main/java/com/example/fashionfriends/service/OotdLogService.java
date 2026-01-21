package com.example.fashionfriends.service;

import com.example.fashionfriends.domain.OotdLog;
import com.example.fashionfriends.dto.OotdLogResponseDto;
import com.example.fashionfriends.repository.HeartRepository;
import com.example.fashionfriends.repository.OotdLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class OotdLogService {

    @Autowired
    private OotdLogRepository ootdLogRepository;
    @Autowired
    private SocialService socialService;
    @Autowired private HeartRepository heartRepository; // 좋아요 확인용
    // 기록 저장
    public OotdLog saveLog(OotdLog log) {
        // saveLog 메서드 마지막 return 직전:
        if (log.isPublic()) {
            socialService.notifyFollowersNewPost(log); // 팔로워들에게 알림
        }
        return ootdLogRepository.save(log);
    }

    // 기록 삭제
    public void deleteLog(Long id) {
        ootdLogRepository.deleteById(id);
    }

    // 1. 내 기록 조회
    @Transactional(readOnly = true)
    public List<OotdLogResponseDto> getMyLogs(Long targetMemberId, Long currentMemberId) {
        List<OotdLog> logs = ootdLogRepository.findByMemberId(targetMemberId);

        return logs.stream().map(log -> {
            boolean isLiked = false;
            if (currentMemberId != null) {
                // SocialService를 이용해 좋아요 여부 확인
                isLiked = socialService.isLogLiked(currentMemberId, log.getId());
            }
            return new OotdLogResponseDto(log, isLiked);
        }).collect(Collectors.toList());
    }

    // 2. 홈 화면 피드 조회
    @Transactional(readOnly = true)
    public List<OotdLogResponseDto> getHomeFeed(Long currentMemberId) {
        // 1. OotdLog 엔티티 목록을 가져옵니다.
        List<OotdLog> logs = ootdLogRepository.findByIsPublicTrueOrderByDateDesc();

        // 2. 엔티티 목록을 DTO 목록으로 변환합니다.
        return logs.stream().map(log -> {
            boolean isLiked = false;
            if (currentMemberId != null) {
                // 좋아요 여부를 계산합니다.
                isLiked = socialService.isLogLiked(currentMemberId, log.getId());
            }

            // 계산된 isLiked 값을 DTO 생성자에 전달합니다.
            return new OotdLogResponseDto(log, isLiked);

        }).collect(Collectors.toList());
    }

    // 3. 기록 수정 (캘린더/상세 화면에서 코멘트/공개 여부 수정)
    public OotdLog updateLog(Long id, String comment, Boolean isPublic) {
        // 1. 기존 데이터를 DB에서 찾음
        OotdLog log = ootdLogRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 기록이 없습니다. id=" + id));

        // 2. 내용 수정
        if (comment != null) {
            log.setComment(comment);
        }
        if (isPublic != null) {
            log.setPublic(isPublic);
        }

        // JPA의 변경감지(Dirty Checking)로 자동 업데이트 처리
        return log;
    }
}