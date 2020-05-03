import { User } from '../src/entity/user';
import { Message, User as DiscordUser } from 'discord.js';
import { mock, instance, verify, capture, anything, when, deepEqual } from 'ts-mockito';
import { Connection } from 'typeorm';
import { TurnipWeek } from '../src/entity/turnip-week';
import { PriceWindow, PriceDay, TurnipPrice } from '../src/entity/turnip-price';
import { StorePrice } from '../src/commands/store-price';
import { addMockRepository, MockRepository } from './helpers/get-mock-repository';

describe('StorePrice command', () => {
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
        storePriceCommand = new StorePrice(instance(mockConnection));
    });

    describe('Command validation', () => {
        it.each`
            messageContent                    | result
            ${'/turnip-price 123 am tuesday'} | ${true}
            ${'/turnip-price friday'}         | ${false}
        `('should return $result if message is "$messageContent"', async ({ messageContent, result }) => {
            message.content = messageContent;
            const isValid = await storePriceCommand.validate(message, user);
            expect(isValid).toBe(result);
        });
    });

    describe('Command execution', () => {
        it('should create a turnip week on demand if user does not have one', async () => {
            message.content = `/turnip-price 123 ${PriceWindow.am} monday`;
            when(mockTurnipWeekRepository.queryBuilder.getOne()).thenResolve(undefined);

            await storePriceCommand.execute(message, user);

            verify(mockTurnipWeekRepository.repository.save(anything())).once();
            const [price] = capture(mockTurnipPriceRepository.repository.save).last();
            expect(price.turnipWeek).toBeDefined();
        });

        it('should update existing price if found', async () => {
            message.content = `/turnip-price 123 ${PriceWindow.am} monday`;
            const turnipWeek = new TurnipWeek();
            when(mockTurnipWeekRepository.queryBuilder.getOne()).thenResolve(turnipWeek);
            const existingPrice = new TurnipPrice();
            existingPrice.priceWindow = PriceWindow.am;
            existingPrice.day = PriceDay.monday;
            existingPrice.price = 10;
            when(
                mockTurnipPriceRepository.repository.findOne(
                    deepEqual({
                        turnipWeek: turnipWeek,
                        day: PriceDay.monday,
                        priceWindow: PriceWindow.am,
                    }),
                ),
            ).thenResolve(existingPrice);

            await storePriceCommand.execute(message, user);

            verify(mockTurnipPriceRepository.repository.save(anything())).once();
            const [price] = capture(mockTurnipPriceRepository.repository.save).last();
            expect(price.day).toBe(existingPrice.day);
            expect(price.priceWindow).toBe(existingPrice.priceWindow);
            expect(price.price).toBe(123);
        });

        it.each`
            messageContent                     | expectedPrice | expectedWindow    | expectedDay
            ${'/turnip-price 123 am monday'}   | ${123}        | ${PriceWindow.am} | ${PriceDay.monday}
            ${'/turnip-price 80 pm tuesday'}   | ${80}         | ${PriceWindow.pm} | ${PriceDay.tuesday}
            ${'/turnip-price 1 am wednesday'}  | ${1}          | ${PriceWindow.am} | ${PriceDay.wednesday}
            ${'/turnip-price 123 am thursday'} | ${123}        | ${PriceWindow.am} | ${PriceDay.thursday}
            ${'/turnip-price 123 am friday'}   | ${123}        | ${PriceWindow.am} | ${PriceDay.friday}
            ${'/turnip-price 123 pm saturday'} | ${123}        | ${PriceWindow.pm} | ${PriceDay.saturday}
        `(
            'should save $result when message is "$message"',
            async ({ messageContent, expectedPrice, expectedWindow, expectedDay }) => {
                message.content = messageContent;
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
