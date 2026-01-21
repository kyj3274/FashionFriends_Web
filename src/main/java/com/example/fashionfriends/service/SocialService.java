package com.example.fashionfriends.service;

import com.example.fashionfriends.domain.*;
import com.example.fashionfriends.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional
public class SocialService {

    @Autowired private HeartRepository heartRepository;
    @Autowired private FollowRepository followRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private OotdLogRepository ootdLogRepository;
    @Autowired private MemberRepository memberRepository;

    // 1. 좋아요 토글 (누르면 ON, 다시 누르면 OFF)
    public int toggleLike(Long memberId, Long logId) {
        Member actor = memberRepository.findById(memberId).orElseThrow();
        OotdLog log = ootdLogRepository.findById(logId).orElseThrow();

        boolean exists = heartRepository.existsByMemberIdAndOotdLogId(memberId, logId);

        if (exists) {
            // 취소
            heartRepository.deleteByMemberIdAndOotdLogId(memberId, logId);
            log.setLikeCount(log.getLikeCount() - 1);
        } else {
            // 생성
            heartRepository.save(new Heart(actor, log));
            log.setLikeCount(log.getLikeCount() + 1);

            // 알림 발송
            if (!log.getMember().getId().equals(memberId)) {
                createNotification(log.getMember(), actor, "LIKE", "님이 회원님의 게시물을 좋아합니다.", logId);
            }
        }
        heartRepository.flush();
        return log.getLikeCount();
    }

    // 2. Ref (팔로우) 요청
    public String requestFollow(Long senderId, Long receiverId) {
        if (senderId.equals(receiverId)) return "SELF";

        Member sender = memberRepository.findById(senderId).orElseThrow();
        Member receiver = memberRepository.findById(receiverId).orElseThrow();

        Follow existing = followRepository.findBySenderAndReceiver(sender, receiver);
        if (existing != null) {
            if (existing.getStatus() == FollowStatus.ACCEPTED) return "ALREADY";
            return "PENDING";
        }

        // 대기 상태로 저장
        followRepository.save(new Follow(sender, receiver));

        // 알림 발송
        createNotification(receiver, sender, "FOLLOW_REQUEST", "님이 Ref(팔로우)를 요청했습니다.", -1L);
        return "REQUESTED";
    }

    // 3. Ref 요청 수락/거절
    public void handleFollowRequest(Long notificationId, boolean isAccept) {
        Notification noti = notificationRepository.findById(notificationId).orElseThrow();
        Member me = noti.getReceiver(); // 나 (요청 받은 사람)
        Member requester = noti.getSender(); // 상대방 (요청 한 사람)

        Follow follow = followRepository.findBySenderAndReceiver(requester, me);
        if (follow != null) {
            if (isAccept) {
                follow.setStatus(FollowStatus.ACCEPTED);
                // 수락 알림
                createNotification(requester, me, "FOLLOW_ACCEPT", "님이 Ref 요청을 수락했습니다.", me.getId());
            } else {
                followRepository.delete(follow); // 거절 시 삭제
            }
        }
        // 처리된 알림은 삭제하거나 읽음 처리
        notificationRepository.delete(noti);
    }

    // 4. 알림 생성 내부 메서드
    private void createNotification(Member receiver, Member sender, String type, String msg, Long targetId) {
        Notification n = new Notification(receiver, sender, type, msg, targetId);
        notificationRepository.save(n);
    }

    // 5. 알림 조회
    public List<Notification> getMyNotifications(Long memberId) {
        return notificationRepository.findByReceiverIdOrderByCreatedAtDesc(memberId);
    }

    // 6. 멤버 프로필 정보 (Mates/Refs 카운트 포함)
    public Map<String, Object> getMemberProfile(Long myId, Long targetMemberId) {
        Member target = memberRepository.findById(targetMemberId).orElseThrow();
        Member me = memberRepository.findById(myId).orElseThrow();

        long mates = followRepository.countByReceiverAndStatus(target, FollowStatus.ACCEPTED); // 팔로워
        long refs = followRepository.countBySenderAndStatus(target, FollowStatus.ACCEPTED);   // 팔로잉

        // 나와의 관계 확인
        String relation = "NONE"; // NONE, PENDING, FRIEND(ACCEPTED)
        Follow f = followRepository.findBySenderAndReceiver(me, target);
        if (f != null) {
            relation = (f.getStatus() == FollowStatus.ACCEPTED) ? "FRIEND" : "PENDING";
        }

        Map<String, Object> info = new HashMap<>();
        info.put("member", target);
        info.put("matesCount", mates);
        info.put("refsCount", refs);
        info.put("relation", relation);
        return info;
    }

    // 7. 새 글 알림 전송 (OotdLogService에서 호출해야 함)
    public void notifyFollowersNewPost(OotdLog log) {
        List<Follow> followers = followRepository.findByReceiverAndStatus(log.getMember(), FollowStatus.ACCEPTED);
        for (Follow f : followers) {
            createNotification(f.getSender(), log.getMember(), "NEW_POST", "님이 새 OOTD를 업로드했습니다.", log.getId());
        }
    }
    // 8. 좋아요 상태 확인 (사용자가 특정 게시물에 좋아요를 눌렀는지 확인)
    @Transactional(readOnly = true)
    public boolean isLogLiked(Long memberId, Long logId) {
        // HeartRepository의 existsByMemberIdAndOotdLogId 메서드를 활용
        return heartRepository.existsByMemberIdAndOotdLogId(memberId, logId);
    }
}