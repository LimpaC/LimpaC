package com.limpac.backend.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class TestRunner {

    public static void main(String[] args) throws Exception {
        List<Class<?>> testClasses = List.of(
                com.limpac.backend.controller.GoalControllerTest.class,
                com.limpac.backend.controller.CalculationControllerTest.class,
                GoalServiceTest.class,
                CalculationServiceTest.class
        );

        int failures = 0;
        String currentGroup = null;
        for (Class<?> testClass : testClasses) {
            String group = groupName(testClass);
            if (!group.equals(currentGroup)) {
                if (currentGroup != null) {
                    System.out.println();
                }
                System.out.println(group);
                currentGroup = group;
            }
            failures += runTestClass(testClass);
        }

        if (failures > 0) {
            System.err.println("Backend tests failed: " + failures + " test(s) failed.");
            System.exit(1);
        }
    }

    private static int runTestClass(Class<?> testClass) throws Exception {
        List<Method> testMethods = new ArrayList<>();
        List<Method> beforeEachMethods = new ArrayList<>();

        for (Method method : testClass.getDeclaredMethods()) {
            if (method.isAnnotationPresent(Test.class)) {
                testMethods.add(method);
            }
            if (method.isAnnotationPresent(BeforeEach.class)) {
                beforeEachMethods.add(method);
            }
        }

        testMethods.sort(Comparator.comparing(Method::getName));
        beforeEachMethods.sort(Comparator.comparing(Method::getName));

        System.out.println("  " + displayNameFor(testClass));

        int failures = 0;
        for (Method testMethod : testMethods) {
            Object instance = testClass.getDeclaredConstructor().newInstance();
            for (Method beforeEach : beforeEachMethods) {
                invoke(beforeEach, instance);
            }

            try {
                invoke(testMethod, instance);
                System.out.println("    ✓ " + displayNameFor(testMethod));
            } catch (InvocationTargetException exception) {
                failures++;
                Throwable cause = exception.getCause() == null ? exception : exception.getCause();
                System.err.println("    ✗ " + displayNameFor(testMethod));
                cause.printStackTrace(System.err);
            }
        }

        return failures;
    }

    private static String groupName(Class<?> testClass) {
        String packageName = testClass.getPackageName();
        if (packageName.contains(".controller")) {
            return "Controladores";
        }
        if (packageName.contains(".service")) {
            return "Servicos";
        }
        return "Outros";
    }

    private static String displayNameFor(Class<?> testClass) {
        DisplayName displayName = testClass.getAnnotation(DisplayName.class);
        return displayName != null ? displayName.value() : testClass.getSimpleName();
    }

    private static String displayNameFor(Method method) {
        DisplayName displayName = method.getAnnotation(DisplayName.class);
        return displayName != null ? displayName.value() : method.getName();
    }

    private static void invoke(Method method, Object instance) throws InvocationTargetException {
        try {
            method.setAccessible(true);
            method.invoke(instance);
        } catch (IllegalAccessException exception) {
            throw new RuntimeException(exception);
        }
    }

    private TestRunner() {
    }
}
