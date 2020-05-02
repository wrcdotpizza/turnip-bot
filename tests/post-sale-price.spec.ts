import { Redis } from 'ioredis';
import { User } from '../src/entity/user';
import { GetMockRedisClient } from './helpers/redis-mock';
import { MockMessage, getMockMessage } from './helpers/get-mock-message';
import { reminderImplementation } from '../src/events/post-sale-price';
import { anyString, verify } from 'ts-mockito';

describe('post /turnip-sale events', () => {
    describe('turnipPurchaseReminder', () => {
        let mockRedis: Redis;
        let mockMessage: MockMessage;
        let user: User;

        beforeEach(() => {
            user = new User();
            user.id = 123;
            user.hasPurchasedTurnipsOnIsland = false;
            mockRedis = GetMockRedisClient();
            mockMessage = getMockMessage();
        });
        // TODO: Update this to use personalMessageState

        it('should do nothing if user has purchased turnips already', async () => {
            user.hasPurchasedTurnipsOnIsland = true;
            await reminderImplementation(mockRedis, { msg: mockMessage.instance, user });
            verify(mockMessage.mockAuthor.send(anyString())).never();
            expect(await mockRedis.keys('*')).toEqual([]);
        });

        it('should send reminder message to update purchase', async () => {
            await reminderImplementation(mockRedis, { msg: mockMessage.instance, user });
            verify(mockMessage.mockAuthor.send(anyString())).once();
        });

        it('should set last message to updateHasPurchased', async () => {
            await reminderImplementation(mockRedis, { msg: mockMessage.instance, user });
            expect((await mockRedis.keys('*')).length).toEqual(1);
        });
    });
});
