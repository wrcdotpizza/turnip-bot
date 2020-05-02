import { Messages } from '../types/messages';
import { MessageHandler } from '../types/message-handler';
import * as PersonalMessageHandlers from './personal-messages';

export type MessageKeys = Partial<Record<Messages, string>>;
type MessageHandlers = { [key in keyof MessageKeys]?: MessageHandler };

const buildMessageHandlers = (): MessageHandlers => {
    const handlers: MessageHandlers = {};
    for (const command of Object.values(PersonalMessageHandlers)) {
        handlers[command.message] = command;
    }
    return handlers;
};

export { buildMessageHandlers };
