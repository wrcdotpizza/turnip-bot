import { Message, User as DiscordUser } from 'discord.js';
import { mock, instance } from 'ts-mockito';

export interface MockMessage {
    mock: Message;
    instance: Message;
    mockAuthor: DiscordUser;
}

export function getMockMessage(): MockMessage {
    const mockMessage = mock(Message);
    const message = instance(mockMessage);
    const mockAuthor = mock(DiscordUser);
    message.author = instance(mockAuthor);
    return {
        mock: mockMessage,
        instance: message,
        mockAuthor,
    };
}
