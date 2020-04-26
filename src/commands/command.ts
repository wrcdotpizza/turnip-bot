import { Message } from 'discord.js';
import { User } from '../entity/user';

export interface Command {
    validate(message: Message, user: User): Promise<boolean>;
    execute(message: Message, user: User): Promise<void>;
}
