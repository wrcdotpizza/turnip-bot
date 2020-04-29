import { Command } from './command';
import { Message } from 'discord.js';
import { Connection, Repository } from 'typeorm';
import { User } from '../entity/user';
import { TurnipWeek } from '../entity/turnip-week';
import { TurnipPrice } from '../entity/turnip-price';
import { SalePrice } from './sale-price';
import { StorePrice } from './store-price';
import { PredictionLinkBuilder } from './models/prediction-link-builder';

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
        const linkBuilder = new PredictionLinkBuilder(
            islandPrice,
            prices,
            user.previousPattern,
            user.hasPurchasedTurnipsOnIsland || false,
        );
        const link = linkBuilder.buildLink();
        await message.reply(`Visit this site to see your prediction for the week: \n${link}`);
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
}
