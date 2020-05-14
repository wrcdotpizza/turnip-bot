import { Message } from 'discord.js';
import { Connection, Repository } from 'typeorm';
import { TurnipPrice, PriceWindow, PriceDay, PriceDayForString } from '../entity/turnip-price';
import { User } from '../entity/user';
import { TurnipWeek } from '../entity/turnip-week';
import { Command } from './command';

interface TurnipPriceMessageValues {
    price: number;
    priceWindow: PriceWindow;
    day: PriceDay;
}

export class StorePrice implements Command {
    public static command = '/turnip-price';
    private readonly messageRegex = /^\/turnip-price (\d{1,3}) (am|pm) (monday|tuesday|wednesday|thursday|friday|saturday)$/;
    private priceRepository: Repository<TurnipPrice>;
    private turnipWeekRepository: Repository<TurnipWeek>;

    constructor(private connection: Connection) {
        this.priceRepository = this.connection.getRepository(TurnipPrice);
        this.turnipWeekRepository = this.connection.getRepository(TurnipWeek);
    }

    public async help(message: Message, _user: User): Promise<void> {
        await message.reply(
            `I couldn't understand your message. Please ensure it is of the format \`/turnip-price <price> <am or pm> <day>\``,
        );
    }

    public async validate(message: Message, _: User): Promise<boolean> {
        try {
            const result = this.messageRegex.test(message.content);
            return Promise.resolve(result);
        } catch (err) {
            console.error('Error occurred when parsing store price message', err);
            return Promise.resolve(false);
        }
    }

    public async execute(message: Message, user: User): Promise<void> {
        const week = (await this.getCurrentTurnipWeek(user)) || (await this.createWeek(user));
        const values = this.parseMessage(message.content);
        const existingPrice = await this.priceRepository.findOne({
            turnipWeek: week,
            day: values.day,
            priceWindow: values.priceWindow,
        });

        if (existingPrice) {
            existingPrice.price = values.price;
            this.priceRepository.save(existingPrice);
            await message.react('🔼');
        } else {
            await this.saveCurrentTurnipPrice(values, week);
            await message.react('✅');
        }
    }

    private async createWeek(user: User): Promise<TurnipWeek> {
        const newWeek = new TurnipWeek();
        newWeek.user = user;
        newWeek.active = true;
        await this.turnipWeekRepository.save(newWeek);
        return newWeek;
    }

    private getCurrentTurnipWeek(user: User): Promise<TurnipWeek | undefined> {
        return this.turnipWeekRepository
            .createQueryBuilder('week')
            .where('"userId" = :id', { id: user.id })
            .orderBy('"createdAt"', 'DESC')
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

    private parseMessage(messageContent: string): TurnipPriceMessageValues {
        const matches = this.messageRegex.exec(messageContent.toLowerCase());
        if (matches === null) {
            throw new Error('Parsing turnip price message failed, this should not be possible');
        }
        matches.shift();
        const [price, priceWindow, day] = matches;
        return {
            price: parseInt(price, 10),
            priceWindow: priceWindow as PriceWindow,
            day: PriceDayForString[day],
        };
    }
}
