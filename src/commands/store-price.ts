import { Message } from 'discord.js';
import { Redis } from 'ioredis';
import { Connection, Repository } from 'typeorm';
import { TurnipPrice } from '../entity/turnip-price';
import { parseTurnipMessage, isTurnipPriceMessage } from '../messages/turnip-price/turnip-price';
import { User } from '../entity/user';
import { TurnipWeek } from '../entity/turnip-week';
import { Command } from './command';

export class StorePrice implements Command {
    public static command = '/price';
    private priceRepository: Repository<TurnipPrice>;
    private turnipWeekRepository: Repository<TurnipWeek>;

    constructor(_: Redis, private connection: Connection) {
        this.priceRepository = this.connection.getRepository(TurnipPrice);
        this.turnipWeekRepository = this.connection.getRepository(TurnipWeek);
    }

    public async validate(message: Message, _: User): Promise<boolean> {
        return new Promise(res => res(isTurnipPriceMessage(message.content)));
    }

    public async execute(message: Message, user: User): Promise<void> {
        const week = await this.turnipWeekRepository
            .createQueryBuilder('week')
            .where({ userId: user.id })
            .addOrderBy('"createdAt"', 'DESC')
            .limit(1)
            .getOne();
        if (!week) {
            await message.reply('If you want to predict your prices you need to report your sale price first.');
            return;
        }

        const { price, priceWindow, day } = parseTurnipMessage(message.content);
        const existingPrice = await this.priceRepository.findOne({ turnipWeek: week, day, priceWindow });
        if (existingPrice) {
            await message.reply('You have already submitted a price this week for that window.');
            return;
        }

        const turnipPrice = new TurnipPrice();
        turnipPrice.price = price;
        turnipPrice.priceWindow = priceWindow;
        turnipPrice.turnipWeek = week;
        turnipPrice.day = day;
        await this.priceRepository.save(turnipPrice);
        await message.react('👍');
    }
}
