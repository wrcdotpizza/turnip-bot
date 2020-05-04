import { Command } from './command';
import { Message } from 'discord.js';
import { User } from '../entity/user';

export class Ping implements Command {
    public static command = '/turnip-ping';

    public help(_: Message, _1: User): Promise<void> {
        return Promise.resolve();
    }

    validate(_: Message, _1: User): Promise<boolean> {
        return Promise.resolve(true);
    }

    async execute(msg: Message, _1: User): Promise<void> {
        await msg.reply('pong');
    }
}
