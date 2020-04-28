import { User } from '../src/entity/user';
import { Message, User as DiscordUser } from 'discord.js';
import { mock, instance, verify, capture, anything, when } from 'ts-mockito';
import { GetMockRedisClient } from './helpers/redis-mock';
import { Connection } from 'typeorm';
import { TurnipWeek } from '../src/entity/turnip-week';
import { PriceWindow, PriceDay, TurnipPrice } from '../src/entity/turnip-price';
import { StorePrice } from '../src/commands/store-price';
import { addMockRepository, MockRepository } from './helpers/get-mock-repository';

describe('SalePrice command', () => {
    let user: User;
    let message: Message;
    let mockAuthor: DiscordUser;
    let mockMessage: Message;
    let mockConnection: Connection;
    let storePriceCommand: StorePrice;
    let mockTurnipWeekRepository: MockRepository<TurnipWeek>;
    let mockTurnipPriceRepository: MockRepository<TurnipPrice>;

    beforeEach(() => {
        mockMessage = mock(Message);
        message = instance(mockMessage);
        mockAuthor = mock(DiscordUser);
        message.author = instance(mockAuthor);
        user = new User();
        mockConnection = mock(Connection);
        mockTurnipWeekRepository = addMockRepository(mockConnection, TurnipWeek);
        mockTurnipPriceRepository = addMockRepository(mockConnection, TurnipPrice);
        storePriceCommand = new StorePrice(GetMockRedisClient(), instance(mockConnection));
    });

    describe('Command validation', () => {
        it.each`
            messageContent           | result
            ${'/turnip-sale 123'}    | ${true}
            ${'/turnip-sale friday'} | ${false}
        `('should return $result if message is "$messageContent"', async ({ messageContent, result }) => {
            message.content = messageContent;
            const isValid = await storePriceCommand.validate(message, user);
            expect(isValid).toBe(result);
        });
    });

    describe('Command execution', () => {
        it('should reply with error if user has already submitted price for the same time frame that week', async () => {
            message.content = `/turnip-price 123 ${PriceWindow.am} ${PriceDay.monday}`;
            const turnipWeek = new TurnipWeek();
            when(mockTurnipWeekRepository.queryBuilder.getOne()).thenResolve(turnipWeek);
            when(
                mockTurnipPriceRepository.repository.findOne({
                    turnipWeek: turnipWeek,
                    day: PriceDay.monday,
                    priceWindow: PriceWindow.am,
                }),
            ).thenResolve(new TurnipPrice());

            await storePriceCommand.execute(message, user);

            verify(mockMessage.reply).once();
            const [response] = capture(mockMessage.reply).last();
            expect(response).toBe('You have already submitted a price this week for that window.');
        });

        it.each`
            message                            | expectedPrice | expectedWindow    | expectedDay
            ${'/turnip-price 123 aM mOnday'}   | ${123}        | ${PriceWindow.am} | ${PriceDay.monday}
            ${'/turnip-price 80 pm tuesday'}   | ${80}         | ${PriceWindow.am} | ${PriceDay.tuesday}
            ${'/turnip-price 1 AM wednesday'}  | ${1}          | ${PriceWindow.am} | ${PriceDay.wednesday}
            ${'/turnip-price 123 am Thursday'} | ${123}        | ${PriceWindow.am} | ${PriceDay.thursday}
            ${'/turnip-price 123 am friday'}   | ${123}        | ${PriceWindow.am} | ${PriceDay.friday}
            ${'/turnip-price 123 PM SATURDAY'} | ${123}        | ${PriceWindow.pm} | ${PriceDay.saturday}
        `(
            'should save $result when message is "$message"',
            async ({ message, expectedPrice, expectedWindow, expectedDay }) => {
                message.content = message;
                await storePriceCommand.execute(message, user);

                verify(mockTurnipPriceRepository.repository.save(anything())).once();
                const [price] = capture(mockTurnipPriceRepository.repository.save).last();
                expect(price.day).toBe(expectedDay);
                expect(price.priceWindow).toBe(expectedWindow);
                expect(price.price).toBe(expectedPrice);
            },
        );
    });
});
