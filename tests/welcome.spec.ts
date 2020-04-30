import { GetMockRedisClient } from './helpers/redis-mock';
import { beginWelcomeConversation } from '../src/messages/welcome/welcome';
import { User } from '../src/entity/user';
import { verify, anything } from 'ts-mockito';
import { MockMessage, getMockMessage } from './helpers/get-mock-message';
import { Messages } from '../src/messages/messages';
import { PersonalMessageState } from '../src/messages/message-helpers/personal-message-state';

describe('Welcome flow', () => {
    let message: MockMessage;
    let personalMessageState: PersonalMessageState;
    let user: User;

    beforeEach(() => {
        message = getMockMessage();
        user = new User();
        user.id = 1;
        personalMessageState = new PersonalMessageState(GetMockRedisClient(), user);
    });

    describe('beginWelcomeConversation', () => {
        it("should send user welcome dm's", async () => {
            await beginWelcomeConversation(personalMessageState, message.instance);
            verify(message.mockAuthor.send(anything())).twice();
        });

        it('should set last_message to islandPurchase', async () => {
            await beginWelcomeConversation(personalMessageState, message.instance);
            expect(await personalMessageState.getLastMessage()).toBe(Messages.welcomeIslandPurchase);
        });
    });
});
