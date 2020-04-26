import { Command } from './command';
import { Message } from 'discord.js';
import { User } from '../entity/user';

export class Ping implements Command {
    public static command = '/turnip-ping';

    async validate(_: Message, _1: User): Promise<boolean> {
        return true;
    }

    async execute(msg: Message, _1: User): Promise<void> {
        await msg.reply('pong');
    }

}