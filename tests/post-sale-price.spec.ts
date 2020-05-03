import { User } from '../src/entity/user';
import { GetMockRedisClient } from './helpers/redis-mock';
import { MockMessage, getMockMessage } from './helpers/get-mock-message';
import { sendTurnipPurchaseReminder } from '../src/events/post-sale-price';
import { anyString, verify, instance, mock, when, deepEqual } from 'ts-mockito';
import { PersonalMessageState } from '../src/messages/message-helpers/personal-message-state';
import { Connection } from 'typeorm';
import { addMockRepository, MockRepository } from './helpers/get-mock-repository';
import { TurnipWeek } from '../src/entity/turnip-week';
import { PostCommandEvent } from '../src/types/turnip-events';
import { Messages } from '../src/types/messages';

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

        describe('sendTurnipPurchaseReminder', () => {
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

            it('should do nothing if user has no turnip week prices', async () => {
                user.hasPurchasedTurnipsOnIsland = false;
                when(mockTurnipWeekRepo.repository.count(deepEqual({ user }))).thenResolve(0);
                await sendTurnipPurchaseReminder(getPostCommandEvent());
                verify(mockMessage.mockAuthor.send(anyString())).never();
                expect(await messageState.getLastMessage()).toEqual(null);
            });

            it('should do nothing if user has one turnip week price', async () => {
                user.hasPurchasedTurnipsOnIsland = false;
                when(mockTurnipWeekRepo.repository.count(deepEqual({ user }))).thenResolve(1);
                await sendTurnipPurchaseReminder(getPostCommandEvent());
                verify(mockMessage.mockAuthor.send(anyString())).never();
                expect(await messageState.getLastMessage()).toEqual(null);
            });

            it('should do nothing if user has purchased turnips already', async () => {
                user.hasPurchasedTurnipsOnIsland = true;
                await sendTurnipPurchaseReminder(getPostCommandEvent());
                verify(mockMessage.mockAuthor.send(anyString())).never();
                expect(await messageState.getLastMessage()).toEqual(null);
            });

            it('should send reminder message to update purchase', async () => {
                await sendTurnipPurchaseReminder(getPostCommandEvent());
                verify(mockMessage.mockAuthor.send(anyString())).once();
            });

            it('should set last message to updateHasPurchased', async () => {
                await sendTurnipPurchaseReminder(getPostCommandEvent());
                expect(await messageState.getLastMessage()).toEqual(Messages.updateHasPurchased);
            });
        });
    });
});
