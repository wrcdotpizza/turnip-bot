import { User } from '../src/entity/user';
import { Message, User as DiscordUser } from 'discord.js';
import { mock, verify, instance, anything, capture, anyString } from 'ts-mockito';
import { Connection } from 'typeorm';
import { TurnipPattern } from '../src/commands/turnip-pattern';
import { MockRepository, addMockRepository } from './helpers/get-mock-repository';
import { PricePatterns } from '../src/types/price-patterns';

describe('TurnipPattern command', () => {
    let user: User;
    let message: Message;
    let mockAuthor: DiscordUser;
    let mockMessage: Message;
    let mockConnection: Connection;
    let salePriceCommand: TurnipPattern;
    let mockUserRepo: MockRepository<User>;

    beforeEach(() => {
        mockMessage = mock(Message);
        message = instance(mockMessage);
        mockAuthor = mock(DiscordUser);
        message.author = instance(mockAuthor);
        user = new User();
        mockConnection = mock(Connection);
        mockUserRepo = addMockRepository(mockConnection, User);
        salePriceCommand = new TurnipPattern(instance(mockConnection));
    });

    describe('Command validation', () => {
        it.each`
            messageContent                                    | result
            ${`/turnip-pattern ${PricePatterns.fluctuating}`} | ${true}
            ${`/turnip-pattern ${PricePatterns.smallSpike}`}  | ${true}
            ${`/turnip-pattern ${PricePatterns.decreasing}`}  | ${true}
            ${`/turnip-pattern ${PricePatterns.largeSpike}`}  | ${true}
            ${`/turnip-pattern ${PricePatterns.unknown}`}     | ${true}
            ${`/turnip-pattern 123`}                          | ${false}
            ${`/turnip-pattern wut`}                          | ${false}
            ${`/turnip-pattern smallSpike`}                   | ${false}
            ${`/turnip-pattern largeSpike`}                   | ${false}
        `('should return $result if message is "$messageContent"', async ({ messageContent, result }) => {
            message.content = messageContent;
            const isValid = await salePriceCommand.validate(message, user);
            expect(isValid).toBe(result);
        });
    });

    describe('Command execution', () => {
        it.each`
            messageContent                                    | storedPattern
            ${`/turnip-pattern ${PricePatterns.fluctuating}`} | ${PricePatterns.fluctuating}
            ${`/turnip-pattern ${PricePatterns.smallSpike}`}  | ${PricePatterns.smallSpike}
            ${`/turnip-pattern ${PricePatterns.decreasing}`}  | ${PricePatterns.decreasing}
            ${`/turnip-pattern ${PricePatterns.largeSpike}`}  | ${PricePatterns.largeSpike}
            ${`/turnip-pattern ${PricePatterns.unknown}`}     | ${PricePatterns.unknown}
        `(
            'should store $result as pattern on user if message is "$messageContent"',
            async ({ messageContent, storedPattern }) => {
                message.content = messageContent;
                await salePriceCommand.execute(message, user);
                verify(mockUserRepo.repository.save(anything())).called();
                const [savedUser] = capture(mockUserRepo.repository.save).last();
                expect(savedUser.previousPattern).toBe(storedPattern);
            },
        );

        it('should default to unknown pattern if pattern does not match known patterns', async () => {
            message.content = '/turnip-pattern wut';
            await salePriceCommand.execute(message, user);
            verify(mockUserRepo.repository.save(anything())).called();
            const [savedUser] = capture(mockUserRepo.repository.save).last();
            expect(savedUser.previousPattern).toBe(PricePatterns.unknown);
        });

        it('should react to message', async () => {
            message.content = `/turnip-pattern ${PricePatterns.fluctuating}`;
            await salePriceCommand.execute(message, user);
            verify(mockMessage.react(anyString())).called();
        });
    });
});
