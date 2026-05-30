package com.limpac.backend.domain.calculation;

public record CardQuantity(double value) {

    public CardQuantity add(double amount) {
        return new CardQuantity(value + amount);
    }

    public CardQuantity subtract(double amount) {
        return new CardQuantity(value - amount);
    }
}
