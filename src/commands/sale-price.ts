import { Message } from 'discord.js';
import { Connection, Repository } from 'typeorm';
import { User } from '../entity/user';
import { TurnipWeek } from '../entity/turnip-week';
import { parseSalePriceMessage, isSalePriceMessage } from '../messages/sale-price/sale-price';
import { Command } from './command';

export class SalePrice implements Command {
    public static command = '/turnip-sale';
    private turnipWeekRepository: Repository<TurnipWeek>;

    constructor(private connection: Connection) {
        this.turnipWeekRepository = this.connection.getRepository(TurnipWeek);
    }

    public validate(message: Message, _user: User): Promise<boolean> {
        try {
            const result = isSalePriceMessage(message.content);
            return Promise.resolve(result);
        } catch (err) {
            console.error('Error occurred when parsing sale price message', err);
            return Promise.resolve(false);
        }
    }

    public async execute(message: Message, user: User): Promise<void> {
        const { price } = parseSalePriceMessage(message.content);
        const previousWeek = await this.turnipWeekRepository.findOne({ user, active: true });
        if (previousWeek) {
            previousWeek.active = false;
            await this.turnipWeekRepository.save(previousWeek);
        }
        const turnipWeek = new TurnipWeek();
        turnipWeek.islandPrice = price;
        turnipWeek.user = user;
        await this.turnipWeekRepository.save(turnipWeek);

        await message.react('✅');
    }
}
