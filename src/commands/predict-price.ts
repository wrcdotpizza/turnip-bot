import { Command } from './command';
import { Message } from 'discord.js';
import { Connection, Repository } from 'typeorm';
import { User } from '../entity/user';
import { TurnipWeek } from '../entity/turnip-week';
import { TurnipPrice } from '../entity/turnip-price';
import { PricePatterns } from '../messages/setup/setup';

const PATTERN = {
    FLUCTUATING: 0,
    LARGE_SPIKE: 1,
    DECREASING: 2,
    SMALL_SPIKE: 3,
};

export class PredictPrice implements Command {
    public static command = '/predict';
    private turnipWeekRepository: Repository<TurnipWeek>;
    private turnipPriceRepository: Repository<TurnipPrice>;

    constructor(connection: Connection) {
        this.turnipWeekRepository = connection.getRepository(TurnipWeek);
        this.turnipPriceRepository = connection.getRepository(TurnipPrice);
    }

    public validate(_: Message, _user: User): Promise<boolean> {
        // Ensure they have an active turnip week
        return Promise.resolve(true);
    }

    public async execute(message: Message, user: User): Promise<void> {
        const week = await this.turnipWeekRepository.findOne({ user, active: true });
        if (!week) {
            console.error('No active turnip week exists for user');
            return;
        }
        const prices = await this.getPricesForWeek(week);
        const islandPrice = week.islandPrice;
        const previousPattern = this.getPatternForPrediction(user.previousPattern!);
        const hasPurchasedTurnips = user.hasPurchasedTurnipsOnIsland;
        const priceString = [islandPrice, ...prices.map(p => p.price)].join('.');
        await message.reply(
            `Visit this site to see your prediction for the week: \nhttps://turnipprophet.io?prices=${priceString}&first=${hasPurchasedTurnips}&pattern=${previousPattern}`,
        );
    }

    private async getPricesForWeek(week: TurnipWeek): Promise<Array<TurnipPrice>> {
        const prices = await this.turnipPriceRepository
            .createQueryBuilder('price')
            .innerJoinAndSelect('price.turnipWeek', 'week')
            .where({ turnipWeekId: week.id })
            .orderBy({ day: 'ASC', '"priceWindow"': 'ASC' })
            .getMany();

        return prices;
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
