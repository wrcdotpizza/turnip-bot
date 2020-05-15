import { User } from '../../src/entity/user';
import { Message, User as DiscordUser } from 'discord.js';
import { mock, verify, instance, when, deepEqual } from 'ts-mockito';
import { Connection, Repository } from 'typeorm';
import { TurnipWeek } from '../../src/entity/turnip-week';
import { ResetWeekCommand } from '../../src/commands/reset-week';

describe('Reset command', () => {
    let user: User;
    let message: Message;
    let mockAuthor: DiscordUser;
    let mockMessage: Message;
    let mockConnection: Connection;
    let resetCommand: ResetWeekCommand;
    let mockTurnipWeekRepository: Repository<TurnipWeek>;

    beforeEach(() => {
        mockTurnipWeekRepository = mock(Repository);
        mockMessage = mock(Message);
        message = instance(mockMessage);
        mockAuthor = mock(DiscordUser);
        message.author = instance(mockAuthor);
        user = new User();
        mockConnection = mock(Connection);
        when(mockConnection.getRepository(TurnipWeek)).thenReturn(instance(mockTurnipWeekRepository));
        resetCommand = new ResetWeekCommand(instance(mockConnection));
    });

    describe('Command execution', () => {
        beforeEach(() => {
            message.content = '/turnip-reset';
        });

        it('should set current turnip week to inactive', async () => {
            const activeTurnipWeek = instance(mock(TurnipWeek));
            activeTurnipWeek.active = true;
            when(mockTurnipWeekRepository.findOne(deepEqual({ user, active: true }))).thenResolve(activeTurnipWeek);

            await resetCommand.execute(message, user);

            expect(activeTurnipWeek.active).toBe(false);
            verify(mockTurnipWeekRepository.save(activeTurnipWeek)).once();
        });
    });
});
