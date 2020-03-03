package com.appsmith.server.aspects;

//import lombok.extern.slf4j.Slf4j;
//import org.aspectj.lang.JoinPoint;
//import org.aspectj.lang.ProceedingJoinPoint;
//import org.aspectj.lang.annotation.Around;
//import org.aspectj.lang.annotation.Aspect;
//import org.aspectj.lang.annotation.Before;
//import org.springframework.stereotype.Component;

//@Aspect
//@Component
//@Slf4j
//public class MongoAspect {

//    @Before("execution(* org.springframework.data.repository.query.RepositoryQuery.*(..))")
//    @Around("execution(* *.createQuery(..)) && bean(repositoryQuery)")
//    public void queryAspect(JoinPoint joinPoint) throws Throwable {
//        log.debug("In the custom mongo Aspect");
//        return joinPoint.proceed();
//    }
//}
