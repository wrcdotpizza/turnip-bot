import { TurnipPrice, PriceWindow, PriceDay } from '../../src/entity/turnip-price';

export function getMockTurnipPrice(window: PriceWindow, day: PriceDay): TurnipPrice {
    const price = new TurnipPrice();
    price.price = Math.trunc(Math.random() * 500);
    price.priceWindow = window;
    price.day = day;
    return price;
}
