import { isTurnipPriceMessage } from './turnip-price';

describe('Turnip Price Message', () => {
    it.each`
        messageContent              | result
        ${'/price 395 am saturday'} | ${true}
        ${'/price 1 pm friday'}     | ${true}
        ${'/price 90 pm tuesday'}   | ${true}
        ${'/price 123 am monday'}   | ${true}
        ${'1'}                      | ${false}
        ${'price 123 pm monday'}    | ${false}
        ${'price 1 pm wednesday'}   | ${false}
        ${'price 1 wednesday'}      | ${false}
        ${'price 1 am'}             | ${false}
        ${'price is 1'}             | ${false}
        ${'turnip price 1123'}      | ${false}
        ${'turnip price: 11234'}    | ${false}
        ${'turnip price: '}         | ${false}
    `("isTurnipPrice('$messageContent') should return $result", ({ messageContent, result }) => {
        expect(isTurnipPriceMessage(messageContent)).toBe(result);
    });
});
