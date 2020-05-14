import { Message } from 'discord.js';
import { Connection, Repository } from 'typeorm';
import { User } from '../entity/user';
import { TurnipWeek } from '../entity/turnip-week';
import { Command } from './command';

export class SalePrice implements Command {
    public static command = '/turnip-sale';
    private readonly messageRegex = /^\/turnip-sale (\d{1,3})$/;
    private turnipWeekRepository: Repository<TurnipWeek>;

    constructor(private connection: Connection) {
        this.turnipWeekRepository = this.connection.getRepository(TurnipWeek);
    }

    public async help(message: Message, _user: User): Promise<void> {
        await message.reply(
            `I couldn't understand your message. Please ensure it is of the format \`/turnip-sale <price>\``,
        );
    }

    public validate(message: Message, _user: User): Promise<boolean> {
        try {
            const result = this.messageRegex.test(message.content);
            return Promise.resolve(result);
        } catch (err) {
            console.error('Error occurred when parsing sale price message', err);
            return Promise.resolve(false);
        }
    }

    public async execute(message: Message, user: User): Promise<void> {
        const { price } = this.parseMessage(message.content);
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

    private parseMessage(messageContent: string): { price: number } {
        const matches = this.messageRegex.exec(messageContent);
        if (matches === null) {
            throw new Error('Parsing turnip price message failed, this should not be possible');
        }
        matches.shift();
        const [price] = matches;
        return { price: parseInt(price, 10) };
    }
}
