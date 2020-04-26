import { isTurnipPriceMessage, parseTurnipMessage } from './turnip-price';
import { PriceWindow, PriceDay } from '../../entity/turnip-price';

describe('Turnip Price Message', () => {
    it.each`
        messageContent                     | result
        ${'/turnip-price 395 am saturday'} | ${true}
        ${'/turnip-price 1 pm friday'}     | ${true}
        ${'/turnip-price 90 pm tuesday'}   | ${true}
        ${'/turnip-price 123 am monday'}   | ${true}
        ${'/turnip-price 123 monday am'}   | ${false}
        ${'/turnip-price monday am 123'}   | ${false}
        ${'1'}                             | ${false}
        ${'price 123 pm monday'}           | ${false}
        ${'price 1 pm wednesday'}          | ${false}
        ${'price 1 wednesday'}             | ${false}
        ${'price 1 am'}                    | ${false}
        ${'price is 1'}                    | ${false}
        ${'turnip price 1123'}             | ${false}
        ${'turnip price: 11234'}           | ${false}
        ${'turnip price: '}                | ${false}
    `("isTurnipPrice('$messageContent') should return $result", ({ messageContent, result }) => {
        expect(isTurnipPriceMessage(messageContent)).toBe(result);
    });

    it.each`
        messageContent                      | result
        ${'/turnip-price 395 am saturday'}  | ${{ price: 395, priceWindow: PriceWindow.am, day: PriceDay.saturday }}
        ${'/turnip-price 1 pm friday'}      | ${{ price: 1, priceWindow: PriceWindow.pm, day: PriceDay.friday }}
        ${'/turnip-price 90 pm tuesday'}    | ${{ price: 90, priceWindow: PriceWindow.pm, day: PriceDay.tuesday }}
        ${'/turnip-price 123 am monday'}    | ${{ price: 123, priceWindow: PriceWindow.am, day: PriceDay.monday }}
        ${'/turnip-price 123 am wednesday'} | ${{ price: 123, priceWindow: PriceWindow.am, day: PriceDay.wednesday }}
        ${'/turnip-price 123 am thursday'}  | ${{ price: 123, priceWindow: PriceWindow.am, day: PriceDay.thursday }}
    `("parseTurnipMessage('$messageContent') should return $result", ({ messageContent, result }) => {
        expect(parseTurnipMessage(messageContent)).toEqual(result);
    });

    it.each(['/turnip-price', '/turnip-price am monday 123', '/turnip-price 123', 'turnip price'])(
        "parseSalePriceMessage('$messageContent') should throw Error",
        messageContent => {
            expect(() => parseTurnipMessage(messageContent)).toThrow();
        },
    );
});
