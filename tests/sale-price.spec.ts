import { isSalePriceMessage, parseSalePriceMessage } from '../src/messages/sale-price/sale-price';

describe('Daisy Mae Price Message', () => {
    it.each`
        messageContent                | result
        ${'/turnip-sale 120'}         | ${true}
        ${'/turnip-sale 80'}          | ${true}
        ${'/turnip-sale 100'}         | ${true}
        ${'/turnip-sale 1'}           | ${true}
        ${'/turnip-sale 1 am friday'} | ${false}
        ${'/turnip-sale 1 am friday'} | ${false}
        ${'1'}                        | ${false}
        ${'daisy mae 10'}             | ${false}
        ${'sale is 1'}                | ${false}
        ${'turnip sa;e 1123'}         | ${false}
        ${'turnip sale: 11234'}       | ${false}
        ${'turnip sale: '}            | ${false}
    `("isSalePriceMessage('$messageContent') should return $result", ({ messageContent, result }) => {
        expect(isSalePriceMessage(messageContent)).toBe(result);
    });

    it.each`
        messageContent        | result
        ${'/turnip-sale 120'} | ${{ price: 120 }}
        ${'/turnip-sale 100'} | ${{ price: 100 }}
        ${'/turnip-sale 1'}   | ${{ price: 1 }}
        ${'/turnip-sale 10'}  | ${{ price: 10 }}
    `("parseSalePriceMessage('$messageContent') should return $result", ({ messageContent, result }) => {
        expect(parseSalePriceMessage(messageContent)).toEqual(result);
    });

    it.each(['/turnip-sale', '/turnip-sale banana', '/turnip-sale 1a', 'sale price'])(
        "parseSalePriceMessage('$messageContent') should throw Error",
        messageContent => {
            expect(() => parseSalePriceMessage(messageContent)).toThrow();
        },
    );
});
