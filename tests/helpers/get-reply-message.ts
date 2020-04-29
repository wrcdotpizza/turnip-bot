import { Message } from 'discord.js';
import { anyString, capture, verify } from 'ts-mockito';

export const getReplyMessage = (message: Message): string => {
    verify(message.reply(anyString())).once();
    const [replyContent] = capture(message.reply).last();
    return replyContent as string;
};
