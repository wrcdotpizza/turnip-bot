import { isSalePriceMessage } from './sale-price';

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
});
