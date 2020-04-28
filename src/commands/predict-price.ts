import { Command } from './command';
import { Message } from 'discord.js';
import { Connection, Repository } from 'typeorm';
import { User } from '../entity/user';
import { TurnipWeek } from '../entity/turnip-week';
import { TurnipPrice, PriceDay, PriceWindow } from '../entity/turnip-price';
import { PricePatterns } from '../messages/welcome/welcome';
import { getEnumValues } from '../helpers/get-enum-values';
import { SalePrice } from './sale-price';
import { StorePrice } from './store-price';

export const PATTERN = {
    FLUCTUATING: 0,
    LARGE_SPIKE: 1,
    DECREASING: 2,
    SMALL_SPIKE: 3,
};

export class PredictPrice implements Command {
    public static command = '/turnip-predict';
    private turnipWeekRepository: Repository<TurnipWeek>;
    private turnipPriceRepository: Repository<TurnipPrice>;

    constructor(connection: Connection) {
        this.turnipWeekRepository = connection.getRepository(TurnipWeek);
        this.turnipPriceRepository = connection.getRepository(TurnipPrice);
    }

    public validate(_message: Message, _user: User): Promise<boolean> {
        // Ensure they have an active turnip week
        return Promise.resolve(true);
    }

    public async execute(message: Message, user: User): Promise<void> {
        const week = await this.turnipWeekRepository.findOne({ user, active: true });
        const prices = await this.getPricesForWeek(week);
        const islandPrice = week ? week.islandPrice : undefined;

        if (prices.length === 0 && !islandPrice) {
            await message.reply(
                `You haven\'t reported any prices, so I am unable to help predict.\n Report a price with the "${SalePrice.command}" or "${StorePrice.command} commands`,
            );
            return;
        }

        const previousPattern = this.getPatternForPrediction(user.previousPattern!);
        const hasPurchasedTurnips = user.hasPurchasedTurnipsOnIsland;
        const priceString = this.buildPriceString(islandPrice, prices);
        await message.reply(
            `Visit this site to see your prediction for the week: \nhttps://turnipprophet.io?prices=${priceString}&first=${!hasPurchasedTurnips}&pattern=${previousPattern}`,
        );
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

    private async getPricesForWeek(week?: TurnipWeek): Promise<Array<TurnipPrice>> {
        let prices = this.turnipPriceRepository
            .createQueryBuilder('price')
            .orderBy({ day: 'ASC', '"priceWindow"': 'ASC' });

        if (week) {
            prices = prices
                .innerJoinAndSelect('price.turnipWeek', 'week')
                .where('"turnipWeekId" = :id', { id: week.id });
        } else {
            prices = prices.where(`"createdAt" >= date_trunc('week', now())`);
        }

        return await prices.getMany();
    }

    private getPatternForPrediction(previousPattern: PricePatterns): number {
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
