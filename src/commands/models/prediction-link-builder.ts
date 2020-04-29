import { TurnipPrice, PriceDay, PriceWindow } from '../../entity/turnip-price';
import { PricePatterns } from '../../messages/welcome/welcome';
import { getEnumValues } from '../../helpers/get-enum-values';

export const PATTERN = {
    FLUCTUATING: 0,
    LARGE_SPIKE: 1,
    DECREASING: 2,
    SMALL_SPIKE: 3,
};

export class PredictionLinkBuilder {
    constructor(
        private islandPrice: number | undefined,
        private prices: Array<TurnipPrice>,
        private previousPattern: PricePatterns | undefined,
        private hasPurchasedOnOwnIsland: boolean,
    ) {}

    public buildLink(): string {
        const previousPattern = this.getPatternForPrediction(this.previousPattern);
        const hasPurchasedTurnips = this.hasPurchasedOnOwnIsland;
        const priceString = this.buildPriceString(this.islandPrice, this.prices);

        return `https://turnipprophet.io?prices=${priceString}&first=${!hasPurchasedTurnips}&pattern=${previousPattern}`;
    }

    private buildPriceString(islandPrice: number | undefined, prices: Array<TurnipPrice>): string {
        const pricesByDay = prices.reduce((carry, price) => {
            const priceDay = price.day!;
            const priceWindow = price.priceWindow!;
            if (!carry[priceDay]) {
                carry[priceDay] = {};
            }
            carry[priceDay][priceWindow] = price.price!;
            return carry;
        }, {} as { [key in PriceDay]: { [key in PriceWindow]?: number } });

        const priceArray = getEnumValues<number>(PriceDay, true)
            .sort()
            .reduce((prices, day) => {
                const pricesForDay = pricesByDay[day as PriceDay];
                const dayPrices = pricesForDay
                    ? [pricesForDay[PriceWindow.am], pricesForDay[PriceWindow.pm]]
                    : [undefined, undefined];
                prices = [...prices, ...dayPrices];
                return prices;
            }, [] as Array<number | undefined>);

        return [islandPrice, ...priceArray].join('.');
    }

    private getPatternForPrediction(previousPattern?: PricePatterns): number {
        if (previousPattern === PricePatterns.fluctuating) {
            return PATTERN.FLUCTUATING;
        } else if (previousPattern === PricePatterns.decreasing) {
            return PATTERN.DECREASING;
        } else if (previousPattern === PricePatterns.largeSpike) {
            return PATTERN.LARGE_SPIKE;
        } else if (previousPattern === PricePatterns.smallSpike) {
            return PATTERN.SMALL_SPIKE;
        } else {
            return -1;
        }
    }
}
