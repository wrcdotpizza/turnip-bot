import { User } from '../src/entity/user';
import { Message, User as DiscordUser } from 'discord.js';
import { mock, verify, instance } from 'ts-mockito';
import { Ping } from '../src/commands/ping';

describe('Ping command', () => {
    let user: User;
    let message: Message;
    let mockAuthor: DiscordUser;
    let mockMessage: Message;
    let pingCommand: Ping;

    beforeEach(() => {
        mockMessage = mock(Message);
        message = instance(mockMessage);
        mockAuthor = mock(DiscordUser);
        message.author = instance(mockAuthor);
        user = new User();
        pingCommand = new Ping();
    });

    it('should always validate message content', async () => {
        expect(await pingCommand.validate(message, user)).toBe(true);
    });

    it('should reply to message with "pong"', async () => {
        await pingCommand.execute(message, user);
        verify(mockMessage.reply('pong')).once();
    });
});
