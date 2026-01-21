package com.example.fashionfriends.repository;

import com.example.fashionfriends.domain.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {
    // 로그인할 때 아이디로 회원 찾기 위해 필요
    Member findByUserId(String userId);
}