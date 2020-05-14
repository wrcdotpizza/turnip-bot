import { PersonalMessageState } from '../src/messages/models/personal-message-state';
import { GetMockRedisClient } from './helpers/redis-mock';
import { Redis } from 'ioredis';
import { User } from '../src/entity/user';
import { Messages } from '../src/types/messages';

describe('PersonalMessageState', () => {
    let messageState: PersonalMessageState;
    let mockRedis: Redis;
    let user: User;

    beforeEach(() => {
        user = new User();
        user.id = 123;
        mockRedis = GetMockRedisClient();
        messageState = new PersonalMessageState(mockRedis, user);
    });

    it('should set last message for user', async () => {
        await messageState.setLastMessage(Messages.updateHasPurchased);
        expect(await messageState.getLastMessage()).toBe(Messages.updateHasPurchased);
    });

    it('should remove last message for user', async () => {
        await messageState.setLastMessage(Messages.updateHasPurchased);
        expect(await messageState.getLastMessage()).toBe(Messages.updateHasPurchased);
        await messageState.unsetLastMessage();
        expect(await messageState.getLastMessage()).toBe(null);
    });
});
