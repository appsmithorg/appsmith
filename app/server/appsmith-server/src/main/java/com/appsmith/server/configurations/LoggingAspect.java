package com.appsmith.server.configurations;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.util.StopWatch;
import reactor.core.publisher.Mono;

import java.util.Objects;
import java.util.concurrent.atomic.AtomicReference;

@Aspect
@Component
@Slf4j
public class LoggingAspect 
{
 
  //AOP expression for which methods shall be intercepted
//  @Around("execution(* com.appsmith.server.services..*(..)))")
//  public Object profileAllMethods(ProceedingJoinPoint proceedingJoinPoint) throws Throwable
//  {
//    MethodSignature methodSignature = (MethodSignature) proceedingJoinPoint.getSignature();
//
//    //Get intercepted method details
//    String className = methodSignature.getDeclaringType().getSimpleName();
//    String methodName = methodSignature.getName();
//
//    final StopWatch stopWatch = new StopWatch();
//
//    //Measure method execution time
//    stopWatch.start();
//    Object result = proceedingJoinPoint.proceed();
//    stopWatch.stop();
//
//    //Log method execution time
//    log.info("[ASPECT]Execution time of " + className + "." + methodName + " :: " + stopWatch.getTotalTimeMillis() + " ms");
//
//    return result;
//  }

  @Around("execution(* com.appsmith.server.services..*(..)))")
  public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {

    long start = System.currentTimeMillis();
    var result = joinPoint.proceed();
    if (result instanceof Mono) {
      var monoResult = (Mono) result;

      return monoResult
              .doOnSuccess(o -> {
                log.info("@@Exit: Thread[{}] {}.{}(), Execution time = {} ms",
                        Thread.currentThread().getName(),
                        joinPoint.getSignature().getDeclaringTypeName(), joinPoint.getSignature().getName(),
                         (System.currentTimeMillis() - start));
              });
    } else {
      return result;
    }
  }
}