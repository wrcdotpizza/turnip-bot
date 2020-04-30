import { Message } from 'discord.js';
import { User } from '../entity/user';

export type MessageEvent = { msg: Message; user: User };

export interface TurnipEvents {
    postSalePrice: MessageEvent;
}

export type TurnipEvent = keyof TurnipEvents;
