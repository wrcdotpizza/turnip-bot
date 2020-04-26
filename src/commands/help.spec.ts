import { User } from '../entity/user';
import { Message, User as DiscordUser } from 'discord.js';
import { mock, verify, instance } from 'ts-mockito';
import { Help, HelpMessage } from './help';

describe('Help command', () => {
    let user: User;
    let message: Message;
    let mockAuthor: DiscordUser;
    let helpCommand: Help;

    beforeEach(() => {
        message = mock(Message);
        mockAuthor = mock(DiscordUser);
        message.author = instance(mockAuthor);
        user = new User();
        helpCommand = new Help();
    });

    it('should always validate message content', async () => {
        expect(await helpCommand.validate(message, user)).toBe(true);
    });

    it('should respond to message with help text', async () => {
        await helpCommand.execute(message, user);
        verify(mockAuthor.send(HelpMessage)).once();
    });
});
