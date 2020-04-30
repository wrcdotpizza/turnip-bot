import fs from 'fs';
import { Message } from 'discord.js';
import { Connection } from 'typeorm';
import { User } from '../entity/user';
import { PersonalMessageState } from './message-helpers/personal-message-state';

export enum Messages {
    welcomeIslandPurchase = 'islandPurchase',
    welcomePattern = 'pattern',
    updateHasPurchased = 'updateHasPurchased',
}

interface MessageHandler {
    message: Messages;
    handler: (
        messageState: PersonalMessageState,
        connection: Connection,
        message: Message,
        user: User,
    ) => Promise<boolean>;
}

export type MessageKeys = Partial<Record<Messages, string>>;
type MessageHandlers = { [key in keyof MessageKeys]?: MessageHandler };

const personalMessageHandlerDir = './personal-messages';

const buildMessageHandlers = async (): Promise<MessageHandlers> => {
    const handlers: MessageHandlers = {};
    const personalMessageHandlerFiles = fs.readdirSync(personalMessageHandlerDir).filter(file => file.endsWith('.ts'));
    for (const file of personalMessageHandlerFiles) {
        const command = (await import(`${personalMessageHandlerDir}/${file}`)) as MessageHandler;
        handlers[command.message] = command;
    }

    return handlers;
};

export { buildMessageHandlers };
