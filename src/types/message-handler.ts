import { User } from '../entity/user';
import { Message } from 'discord.js';
import { PersonalMessageState } from '../messages/message-helpers/personal-message-state';
import { Connection } from 'typeorm';
import { Messages } from './messages';

export interface MessageHandler {
    message: Messages;
    handler: (
        messageState: PersonalMessageState,
        connection: Connection,
        message: Message,
        user: User,
    ) => Promise<boolean>;
}
