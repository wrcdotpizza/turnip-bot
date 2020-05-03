import { Command } from './command';
import { Message } from 'discord.js';
import { User } from '../entity/user';
import { getEnumValues } from '../helpers/get-enum-values';
import { PricePatterns } from '../types/price-patterns';
import { Connection, Repository } from 'typeorm';

export class TurnipPattern implements Command {
    public static command = '/turnip-pattern';
    private userRepo: Repository<User>;

    constructor(connection: Connection) {
        this.userRepo = connection.getRepository(User);
    }

    public async help(message: Message, _user: User): Promise<void> {
        await message.reply(
            `I didn't understand your pattern. Please ensure it is ${getEnumValues(PricePatterns).join(' or ')}`,
        );
    }

    validate(message: Message, _user: User): Promise<boolean> {
        const pattern = this.parseMessage(message.content);
        return Promise.resolve(pattern ? true : false);
    }

    private parseMessage(messageContent: string): PricePatterns | null {
        const messageRegex = new RegExp(`^\/turnip-pattern (${getEnumValues(PricePatterns).join('|')})`);
        const matches = messageRegex.exec(messageContent);
        return matches ? (matches[1] as PricePatterns) : null;
    }

    async execute(message: Message, user: User): Promise<void> {
        const pattern = this.parseMessage(message.content);
        user.previousPattern = pattern || PricePatterns.unknown;
        await this.userRepo.save(user);
        await message.react('✅');
    }
}
