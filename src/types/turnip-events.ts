import { Message } from 'discord.js';
import { User } from '../entity/user';

export type MessageEvent = { msg: Message; user: User };
