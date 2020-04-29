import { PredictionLinkBuilder, PATTERN } from '../src/commands/models/prediction-link-builder';
import { getMockTurnipPrice } from './helpers/get-mock-turnip-price';
import { PriceWindow, PriceDay, TurnipPrice } from '../src/entity/turnip-price';
import { Parse } from './helpers/parse';
import { PricePatterns } from '../src/types/price-patterns';

describe('PredictionLinkBuilder', () => {
    let linkBuilder: PredictionLinkBuilder;

    describe('Parameters', () => {
        let pattern: PricePatterns;
        let prices: Array<TurnipPrice>;
        let islandPrice: number;

        beforeEach(() => {
            prices = [
                getMockTurnipPrice(PriceWindow.am, PriceDay.monday),
                getMockTurnipPrice(PriceWindow.pm, PriceDay.monday),
                getMockTurnipPrice(PriceWindow.am, PriceDay.tuesday),
                getMockTurnipPrice(PriceWindow.pm, PriceDay.friday),
                getMockTurnipPrice(PriceWindow.am, PriceDay.saturday),
            ];
            pattern = PricePatterns.unknown;
            islandPrice = 100;
        });

        describe('?first', () => {
            it('should set "first" query parameter to true if has not bought turnips on their island', () => {
                linkBuilder = new PredictionLinkBuilder(islandPrice, prices, pattern, false);
                const link = linkBuilder.buildLink();
                const parsedLink = Parse.parseLink(link);
                expect(parsedLink.query['first']).toBe('true');
            });

            it('should set "first" query parameter to false if user has bought turnips on their island', () => {
                linkBuilder = new PredictionLinkBuilder(islandPrice, prices, pattern, true);
                const link = linkBuilder.buildLink();
                const parsedLink = Parse.parseLink(link);
                expect(parsedLink.query['first']).toBe('false');
            });
        });

        describe('?pattern', () => {
            it.each`
                previousPattern              | result
                ${PricePatterns.fluctuating} | ${PATTERN.FLUCTUATING}
                ${PricePatterns.decreasing}  | ${PATTERN.DECREASING}
                ${PricePatterns.largeSpike}  | ${PATTERN.LARGE_SPIKE}
                ${PricePatterns.smallSpike}  | ${PATTERN.SMALL_SPIKE}
                ${PricePatterns.unknown}     | ${-1}
            `('should set ?pattern=$result if previousPattern is "$previousPattern"', ({ previousPattern, result }) => {
                linkBuilder = new PredictionLinkBuilder(islandPrice, prices, previousPattern, true);
                const link = linkBuilder.buildLink();
                const parsedLink = Parse.parseLink(link);
                expect(parsedLink.query['pattern']).toBe(result.toString());
            });
        });

        describe('?prices', () => {
            it('should put the islandPrice first', () => {
                const islandPrice = 100;
                const linkBuilder = new PredictionLinkBuilder(islandPrice, prices, pattern, true);
                const link = linkBuilder.buildLink();
                const parsedLink = Parse.parseLink(link);
                const parsedPrices = parsedLink.query['prices']?.split('.');
                expect(parsedPrices && parsedPrices[0]).toBe(islandPrice.toString());
            });

            it('should place the prices in the correct order', () => {
                const islandPrice = 100;
                const prices = [
                    getMockTurnipPrice(PriceWindow.am, PriceDay.monday),
                    getMockTurnipPrice(PriceWindow.pm, PriceDay.monday),
                    getMockTurnipPrice(PriceWindow.am, PriceDay.tuesday),
                    getMockTurnipPrice(PriceWindow.pm, PriceDay.tuesday),
                    getMockTurnipPrice(PriceWindow.am, PriceDay.wednesday),
                ];
                const linkBuilder = new PredictionLinkBuilder(islandPrice, prices, pattern, true);
                const link = linkBuilder.buildLink();
                const parsedLink = Parse.parseLink(link);
                const parsedPrices = parsedLink.query['prices']?.split('.');
                expect(parsedPrices?.length).toBe(13);
                const expectedPrices = [islandPrice, ...prices.map(p => p.price!)].map(i => i?.toString());
                expect(parsedPrices?.slice(0, expectedPrices.length)).toEqual(expectedPrices);
            });

            it('should put empty prices for not included dates', () => {
                const islandPrice = 100;
                const prices = [
                    getMockTurnipPrice(PriceWindow.am, PriceDay.monday),
                    getMockTurnipPrice(PriceWindow.pm, PriceDay.monday),
                    getMockTurnipPrice(PriceWindow.am, PriceDay.tuesday),
                    getMockTurnipPrice(PriceWindow.pm, PriceDay.friday),
                    getMockTurnipPrice(PriceWindow.am, PriceDay.saturday),
                ];
                const linkBuilder = new PredictionLinkBuilder(islandPrice, prices, pattern, true);
                const link = linkBuilder.buildLink();
                const parsedLink = Parse.parseLink(link);
                const expectedPrices = [
                    islandPrice,
                    prices[0].price,
                    prices[1].price,
                    prices[2].price,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    prices[3].price,
                    prices[4].price,
                    undefined,
                ];
                expect(parsedLink.query['prices']).toEqual(expectedPrices.join('.'));
            });
        });
    });
});
