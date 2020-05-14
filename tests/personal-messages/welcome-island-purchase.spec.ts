import { PersonalMessageState } from '../../src/messages/models/personal-message-state';
import { Connection } from 'typeorm';
import { MockMessage, getMockMessage } from '../helpers/get-mock-message';
import { MockRepository, addMockRepository } from '../helpers/get-mock-repository';
import { GetMockRedisClient } from '../helpers/redis-mock';
import { mock, instance, verify, deepEqual, anyString } from 'ts-mockito';
import { User } from '../../src/entity/user';
import handler from '../../src/messages/personal-messages/welcome-island-purchase';
import { Messages } from '../../src/types/messages';

describe('welcomeIslandPurchase handler', () => {
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

    //TODO: Have it just run `update-has-purchased.spec.ts`?

    it('should have message propery set to welcomeIslandPurchase', () => {
        expect(handler.message).toBe(Messages.welcomeIslandPurchase);
    });

    it('should reply with error if answer is not understood', async () => {
        message.instance.content = 'what';
        const result = await handler.handler(messageState, instance(mockConnection), message.instance, user);
        verify(message.mock.reply("Sorry, I don't know what that means")).once();
        expect(result).toBe(false);
    });

    it('should not set last message to welcomePattern if answer is not understood', async () => {
        message.instance.content = 'what';
        await handler.handler(messageState, instance(mockConnection), message.instance, user);
        expect(await messageState.getLastMessage()).toBe(null);
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

    it('should send new questions when answer is understood', async () => {
        message.instance.content = 'no';
        await handler.handler(messageState, instance(mockConnection), message.instance, user);
        verify(message.mockAuthor.send(anyString())).called();
    });

    it('should set last message to welcomePattern if answer is understood', async () => {
        message.instance.content = 'no';
        await handler.handler(messageState, instance(mockConnection), message.instance, user);
        expect(await messageState.getLastMessage()).toBe(Messages.welcomePattern);
    });
});
