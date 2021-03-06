import { Message } from 'discord.js';
import { User } from '../entity/user';
import { Connection } from 'typeorm';
import { PersonalMessageState } from '../messages/models/personal-message-state';

export type PostCommandEvent = { msg: Message; user: User; connection: Connection; messageState: PersonalMessageState };
