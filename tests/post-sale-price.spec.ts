import { User } from '../src/entity/user';
import { GetMockRedisClient } from './helpers/redis-mock';
import { MockMessage, getMockMessage } from './helpers/get-mock-message';
import { HasPurchasedReminder, PatternReminder } from '../src/events/operations';
import { anyString, verify, instance, mock, when, deepEqual } from 'ts-mockito';
import { PersonalMessageState } from '../src/messages/message-helpers/personal-message-state';
import { Connection } from 'typeorm';
import { addMockRepository, MockRepository } from './helpers/get-mock-repository';
import { TurnipWeek } from '../src/entity/turnip-week';
import { PostCommandEvent } from '../src/types/turnip-events';

describe('post /turnip-sale events', () => {
    describe('turnipPurchaseReminder', () => {
        let messageState: PersonalMessageState;
        let mockMessage: MockMessage;
        let user: User;
        let connection: Connection;
        let mockTurnipWeekRepo: MockRepository<TurnipWeek>;

        const getPostCommandEvent = (): PostCommandEvent => ({
            msg: mockMessage.instance,
            user,
            messageState,
            connection,
        });

        beforeEach(() => {
            user = new User();
            user.id = 123;
            user.hasPurchasedTurnipsOnIsland = false;
            mockMessage = getMockMessage();
            messageState = new PersonalMessageState(GetMockRedisClient(), user);
            const mockConnection = mock(Connection);
            connection = instance(mockConnection);
            mockTurnipWeekRepo = addMockRepository(mockConnection, TurnipWeek);
            when(mockTurnipWeekRepo.repository.count(deepEqual({ user }))).thenResolve(2);
        });

        describe('PatternReminder', () => {
            describe('shouldSend', () => {
                it('should return false if user has no turnip week prices', async () => {
                    when(mockTurnipWeekRepo.repository.count(deepEqual({ user }))).thenResolve(0);
                    const shouldSend = await PatternReminder.shouldSend(getPostCommandEvent());
                    expect(shouldSend).toBe(false);
                });

                it('should return false if user has one turnip week price', async () => {
                    when(mockTurnipWeekRepo.repository.count(deepEqual({ user }))).thenResolve(1);
                    const shouldSend = await PatternReminder.shouldSend(getPostCommandEvent());
                    expect(shouldSend).toBe(false);
                });

                it('should return true if user has more than one turnip week price', async () => {
                    when(mockTurnipWeekRepo.repository.count(deepEqual({ user }))).thenResolve(2);
                    const shouldSend = await PatternReminder.shouldSend(getPostCommandEvent());
                    expect(shouldSend).toBe(true);
                });
            });

            it('should send reminder message to update pattern', async () => {
                await PatternReminder.execute(getPostCommandEvent());
                verify(mockMessage.mockAuthor.send(anyString())).once();
            });
        });

        describe('HasPurchasedReminder', () => {
            describe('shouldSend', () => {
                it('should return false if user has no turnip week prices', async () => {
                    user.hasPurchasedTurnipsOnIsland = false;
                    when(mockTurnipWeekRepo.repository.count(deepEqual({ user }))).thenResolve(0);
                    const shouldSend = await HasPurchasedReminder.shouldSend(getPostCommandEvent());
                    expect(shouldSend).toBe(false);
                });

                it('should return false if user has one turnip week price', async () => {
                    user.hasPurchasedTurnipsOnIsland = false;
                    when(mockTurnipWeekRepo.repository.count(deepEqual({ user }))).thenResolve(1);
                    const shouldSend = await HasPurchasedReminder.shouldSend(getPostCommandEvent());
                    expect(shouldSend).toBe(false);
                });

                it('should return false if user has purchased turnips already', async () => {
                    user.hasPurchasedTurnipsOnIsland = true;
                    const shouldSend = await HasPurchasedReminder.shouldSend(getPostCommandEvent());
                    expect(shouldSend).toBe(false);
                });

                it('should not send if user has purchased turnips and has more than one price', async () => {
                    user.hasPurchasedTurnipsOnIsland = true;
                    when(mockTurnipWeekRepo.repository.count(deepEqual({ user }))).thenResolve(1);
                    const shouldSend = await HasPurchasedReminder.shouldSend(getPostCommandEvent());
                    expect(shouldSend).toBe(false);
                });

                it('should send if user has not purchased turnips on their island and this is their second week', async () => {
                    user.hasPurchasedTurnipsOnIsland = false;
                    when(mockTurnipWeekRepo.repository.count(deepEqual({ user }))).thenResolve(2);
                    const shouldSend = await HasPurchasedReminder.shouldSend(getPostCommandEvent());
                    expect(shouldSend).toBe(true);
                });
            });

            it('should send reminder message to update purchase', async () => {
                await HasPurchasedReminder.execute(getPostCommandEvent());
                verify(mockMessage.mockAuthor.send(anyString())).once();
            });
        });
    });
});
