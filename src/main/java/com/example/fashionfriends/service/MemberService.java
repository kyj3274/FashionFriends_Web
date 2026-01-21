package com.example.fashionfriends.service;

import com.example.fashionfriends.domain.Member;
import com.example.fashionfriends.repository.MemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MemberService {

    @Autowired
    private MemberRepository memberRepository;

    // 회원가입
    public Member join(Member member) {
        return memberRepository.save(member);
    }

    // 로그인
    public Member login(String userId, String password) {
        // 1. 아이디로 DB 조회
        Member member = memberRepository.findByUserId(userId);

        // 2. 멤버가 존재하고 && 비밀번호가 일치하면 -> 성공(객체 반환)
        if (member != null && member.getPassword().equals(password)) {
            return member;
        }
        // 3. 아니면 -> 실패(null 반환)
        return null;
    }
    public Member updateMember(String userId, String newNickname) {
        // 1. DB에서 유저 찾기
        Member member = memberRepository.findByUserId(userId);

        // 2. 닉네임 변경
        if (member != null) {
            member.setNickname(newNickname);
            // member.setProfileImg("https://placehold.co/100x100/A1887F/fff?text=" + newNickname.substring(0,1));

            // 3. 저장 (Update)
            return memberRepository.save(member);
        }
        return null; // 유저가 없을 경우
    }
}