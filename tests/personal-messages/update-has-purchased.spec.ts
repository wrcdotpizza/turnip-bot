import handler from '../../src/messages/personal-messages/update-has-purchased';
import { Messages } from '../../src/types/messages';
import { PersonalMessageState } from '../../src/messages/models/personal-message-state';
import { GetMockRedisClient } from '../helpers/redis-mock';
import { User } from '../../src/entity/user';
import { Connection } from 'typeorm';
import { mock, instance, verify, deepEqual } from 'ts-mockito';
import { getMockMessage, MockMessage } from '../helpers/get-mock-message';
import { addMockRepository, MockRepository } from '../helpers/get-mock-repository';

describe('updateHasPurchased handler', () => {
    let messageState: PersonalMessageState;
    let user: User;
    let mockConnection: Connection;
    let message: MockMessage;
    let mockUserRepo: MockRepository<User>;

    beforeEach(() => {
        user = new User();
        user.id = 123;
        messageState = new PersonalMessageState(GetMockRedisClient(), user);
        mockConnection = mock(Connection);
        message = getMockMessage();
        mockUserRepo = addMockRepository(mockConnection, User);
    });

    it('should have message property set to updateHasPurchased', () => {
        expect(handler.message).toBe(Messages.updateHasPurchased);
    });

    it('should reply to message with error if answer is not understood', async () => {
        message.instance.content = 'unknown';
        await handler.handler(messageState, instance(mockConnection), message.instance, user);
        verify(message.mock.reply(`Sorry, I didn\'t understand. Try "yes" or "no".`)).once();
    });

    it('should return false if reply is not understood', async () => {
        message.instance.content = 'unknown';
        const result = await handler.handler(messageState, instance(mockConnection), message.instance, user);
        expect(result).toBe(false);
    });

    it('should update hasPurchasedTurnipsOnIsland to true if answer is yes', async () => {
        message.instance.content = 'yes';
        const result = await handler.handler(messageState, instance(mockConnection), message.instance, user);
        expect(user.hasPurchasedTurnipsOnIsland).toBe(true);
        verify(mockUserRepo.repository.save(deepEqual(user))).once();
        expect(result).toBe(true);
    });

    it('should update hasPurchasedTurnipsOnIsland to false if answer is false', async () => {
        message.instance.content = 'no';
        const result = await handler.handler(messageState, instance(mockConnection), message.instance, user);
        expect(user.hasPurchasedTurnipsOnIsland).toBe(false);
        verify(mockUserRepo.repository.save(deepEqual(user))).once();
        expect(result).toBe(true);
    });
});
