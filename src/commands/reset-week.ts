import { Message } from 'discord.js';
import { Connection, Repository } from 'typeorm';
import { User } from '../entity/user';
import { TurnipWeek } from '../entity/turnip-week';
import { Command } from './command';

export class ResetWeekCommand implements Command {
    public static command = '/turnip-reset';
    private readonly messageRegex = /^\/turnip-reset$/;
    private turnipWeekRepository: Repository<TurnipWeek>;

    constructor(private connection: Connection) {
        this.turnipWeekRepository = this.connection.getRepository(TurnipWeek);
    }

    public async help(message: Message, _user: User): Promise<void> {
        await message.reply(`I couldn't understand your message`);
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
        const previousWeek = await this.turnipWeekRepository.findOne({ user, active: true });
        if (previousWeek) {
            previousWeek.active = false;
            await this.turnipWeekRepository.save(previousWeek);
        }

        await message.react('✅');
    }
}
