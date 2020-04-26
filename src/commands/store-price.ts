import { Message } from 'discord.js';
import { Redis } from 'ioredis';
import { Connection, Repository } from 'typeorm';
import { TurnipPrice } from '../entity/turnip-price';
import {
    parseTurnipMessage,
    isTurnipPriceMessage,
    TurnipPriceMessageValues,
} from '../messages/turnip-price/turnip-price';
import { User } from '../entity/user';
import { TurnipWeek } from '../entity/turnip-week';
import { Command } from './command';

export class StorePrice implements Command {
    public static command = '/turnip-price';
    private priceRepository: Repository<TurnipPrice>;
    private turnipWeekRepository: Repository<TurnipWeek>;

    constructor(_: Redis, private connection: Connection) {
        this.priceRepository = this.connection.getRepository(TurnipPrice);
        this.turnipWeekRepository = this.connection.getRepository(TurnipWeek);
    }

    public async validate(message: Message, _: User): Promise<boolean> {
        return Promise.resolve(isTurnipPriceMessage(message.content));
    }

    public async execute(message: Message, user: User): Promise<void> {
        const week = await this.getCurrentTurnipWeek(user);
        const values = parseTurnipMessage(message.content);
        const existingPrice = await this.priceRepository.findOne({
            turnipWeek: week,
            day: values.day,
            priceWindow: values.priceWindow,
        });
        if (existingPrice) {
            await message.reply('You have already submitted a price this week for that window.');
            return;
        }

        await this.saveCurrentTurnipPrice(values, week);
        await message.react('✅');
    }

    private getCurrentTurnipWeek(user: User): Promise<TurnipWeek | undefined> {
        return this.turnipWeekRepository
            .createQueryBuilder('week')
            .where({ userId: user.id })
            .addOrderBy('"createdAt"', 'DESC')
            .limit(1)
            .getOne();
    }

    private async saveCurrentTurnipPrice(values: TurnipPriceMessageValues, week?: TurnipWeek): Promise<void> {
        const { price, priceWindow, day } = values;
        const turnipPrice = new TurnipPrice();
        turnipPrice.price = price;
        turnipPrice.priceWindow = priceWindow;
        turnipPrice.turnipWeek = week;
        turnipPrice.day = day;
        await this.priceRepository.save(turnipPrice);
    }
}
