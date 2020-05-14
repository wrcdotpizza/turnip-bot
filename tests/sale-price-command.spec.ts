import { User } from '../src/entity/user';
import { Message, User as DiscordUser } from 'discord.js';
import { mock, verify, instance, when, anything, capture, anyString } from 'ts-mockito';
import { SalePrice } from '../src/commands/sale-price';
import { Connection, Repository } from 'typeorm';
import { TurnipWeek } from '../src/entity/turnip-week';

describe('SalePrice command', () => {
    let user: User;
    let message: Message;
    let mockAuthor: DiscordUser;
    let mockMessage: Message;
    let mockConnection: Connection;
    let salePriceCommand: SalePrice;
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
        salePriceCommand = new SalePrice(instance(mockConnection));
    });

    describe('Command validation', () => {
        it.each`
            messageContent                | result
            ${'/turnip-sale 120'}         | ${true}
            ${'/turnip-sale 80'}          | ${true}
            ${'/turnip-sale 100'}         | ${true}
            ${'/turnip-sale 1'}           | ${true}
            ${'/turnip-sale 1 am friday'} | ${false}
            ${'/turnip-sale 1 am friday'} | ${false}
            ${'1'}                        | ${false}
            ${'daisy mae 10'}             | ${false}
            ${'sale is 1'}                | ${false}
            ${'turnip sa;e 1123'}         | ${false}
            ${'turnip sale: 11234'}       | ${false}
            ${'turnip sale: '}            | ${false}
        `('should return $result if message is "$messageContent"', async ({ messageContent, result }) => {
            message.content = messageContent;
            const isValid = await salePriceCommand.validate(message, user);
            expect(isValid).toBe(result);
        });
    });

    describe('Command execution', () => {
        beforeEach(() => {
            message.content = '/turnip-sale 123';
        });

        it('should set previous turnip week to inactive if user has one', async () => {
            const activeTurnipWeek = instance(mock(TurnipWeek));
            when(mockTurnipWeekRepository.findOne(anything())).thenResolve(activeTurnipWeek);

            await salePriceCommand.execute(message, user);

            expect(activeTurnipWeek.active).toBe(false);
            verify(mockTurnipWeekRepository.save(activeTurnipWeek)).once();
        });

        it('should create new turnip week for price and mark it active', async () => {
            await salePriceCommand.execute(message, user);

            verify(mockTurnipWeekRepository.save(anything())).once();
            const [savedWeek] = capture(mockTurnipWeekRepository.save).last();
            expect(savedWeek.active).toBe(undefined); // Leave active to the default on the column
            expect(savedWeek.user).toBe(user);
            expect(savedWeek.islandPrice).toBe(123);
        });

        it('should react to message to signal user the price was received', async () => {
            await salePriceCommand.execute(message, user);
            verify(mockMessage.react(anyString())).once();
        });
    });
});
