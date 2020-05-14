import { PersonalMessageState } from '../../src/messages/models/personal-message-state';
import { Connection } from 'typeorm';
import { MockMessage, getMockMessage } from '../helpers/get-mock-message';
import { MockRepository, addMockRepository } from '../helpers/get-mock-repository';
import { GetMockRedisClient } from '../helpers/redis-mock';
import { mock, verify, deepEqual, instance } from 'ts-mockito';
import { User } from '../../src/entity/user';
import handler from '../../src/messages/personal-messages/welcome-pattern';
import { PricePatterns } from '../../src/types/price-patterns';
import { Messages } from '../../src/types/messages';

describe('welcomePattern handler', () => {
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

    it('should have message property set to welcomePattern', () => {
        expect(handler.message).toBe(Messages.welcomePattern);
    });

    it.each`
        response         | pattern
        ${'fluctuating'} | ${PricePatterns.fluctuating}
        ${'small spike'} | ${PricePatterns.smallSpike}
        ${'large spike'} | ${PricePatterns.largeSpike}
        ${'unknown'}     | ${PricePatterns.unknown}
        ${'decreasing'}  | ${PricePatterns.decreasing}
    `('should store pattern as $pattern if response is $response', async ({ response, pattern }) => {
        message.instance.content = response;
        await handler.handler(messageState, instance(mockConnection), message.instance, user);
        expect(user.previousPattern).toBe(pattern);
        verify(mockUserRepo.repository.save(deepEqual(user))).atLeast(1);
    });

    it('should mark user as been welcomed when complete', async () => {
        message.instance.content = 'fluctuating';
        await handler.handler(messageState, instance(mockConnection), message.instance, user);
        expect(user.hasBeenWelcomed).toBe(true);
    });

    it('should reply and not mark user as welcomed if does not understand response', async () => {
        message.instance.content = 'what';
        await handler.handler(messageState, instance(mockConnection), message.instance, user);
        expect(user.hasBeenWelcomed).toBe(undefined);
    });

    it('should clear last message for user if message is understood', async () => {
        message.instance.content = 'fluctuating';
        await handler.handler(messageState, instance(mockConnection), message.instance, user);
        expect(await messageState.getLastMessage()).toBe(null);
    });
});
