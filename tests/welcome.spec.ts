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

    // describe('isInWelcomeAndIsDm', () => {
    //     it.each`
    //         messageChannel | welcomeKeyValue | result
    //         ${'dm'}        | ${0}            | ${false}
    //         ${'dm'}        | ${1}            | ${true}
    //         ${'dm'}        | ${undefined}    | ${false}
    //         ${'dm'}        | ${null}         | ${false}
    //         ${'server'}    | ${1}            | ${false}
    //         ${'server'}    | ${0}            | ${false}
    //         ${'server'}    | ${undefined}    | ${false}
    //         ${'server'}    | ${null}         | ${false}
    //         ${'server'}    | ${'N/A'}        | ${false}
    //     `(
    //         'should return "$result" when for messageChannel $messageChannel and welcome key set to $welcomeKeyValue',
    //         async ({ messageChannel, welcomeKeyValue, result }) => {
    //             message.instance.channel = ({ type: messageChannel } as unknown) as TextChannel;
    //             if (welcomeKeyValue !== 'N/A') {
    //                 await mockRedis.set(`welcome:${user.id}`, welcomeKeyValue);
    //             }
    //             const actualResult = await isInWelcomeAndIsDm(mockRedis, user, message.instance);
    //             expect(actualResult).toBe(result);
    //         },
    //     );
    // });

    // describe('continueWelcomeQuestions', () => {
    //     let userRepo: MockRepository<User>;
    //     let userRepoInstance: Repository<User>;

    //     beforeEach(() => {
    //         userRepo = getMockRepository<User>();
    //         userRepoInstance = instance(userRepo.repository);
    //     });

    //     describe('Last message was "islandPurchase"', () => {
    //         beforeEach(async () => {
    //             await mockRedis.set(`welcome:${user.id}:last_message`, Messages.welcomeIslandPurchase);
    //         });

    //         it.each(['yes', 'yup', 'yeah', 'yee', 'yea'])(
    //             'should store hasPurchasedTurnipsOnIsland as true when answered "%p"',
    //             async value => {
    //                 message.instance.content = value;
    //                 await continueWelcomeQuestions(mockRedis, user, message.instance, userRepoInstance);
    //                 expect(user.hasPurchasedTurnipsOnIsland).toBe(true);
    //                 verify(userRepo.repository.save(user)).once();
    //                 expect(await mockRedis.get(`welcome:${user.id}:last_message`)).toBe(Messages.welcomePattern);
    //             },
    //         );

    //         it.each(['no', 'Nope', 'nah', 'nay', 'NO'])(
    //             'should store hasPurchasedTurnipsOnIsland as false when answered "%p"',
    //             async value => {
    //                 message.instance.content = value;
    //                 await continueWelcomeQuestions(mockRedis, user, message.instance, userRepoInstance);
    //                 expect(user.hasPurchasedTurnipsOnIsland).toBe(false);
    //                 verify(userRepo.repository.save(user)).once();
    //                 expect(await mockRedis.get(`welcome:${user.id}:last_message`)).toBe(Messages.welcomePattern);
    //             },
    //         );

    //         it('should reply with a message if does not understand response and not save user', async () => {
    //             message.instance.content = 'What';
    //             await continueWelcomeQuestions(mockRedis, user, message.instance, userRepoInstance);
    //             verify(message.mock.reply(anyString())).once();
    //             expect(user.hasPurchasedTurnipsOnIsland).toBe(undefined);
    //         });
    //     });

    //     describe('Last message was "pattern"', () => {
    //         beforeEach(async () => {
    //             await mockRedis.set(`welcome:${user.id}:last_message`, Messages.welcomePattern);
    //         });

    //         it.each`
    //             response         | pattern
    //             ${'fluctuating'} | ${PricePatterns.fluctuating}
    //             ${'small spike'} | ${PricePatterns.smallSpike}
    //             ${'large spike'} | ${PricePatterns.largeSpike}
    //             ${'unknown'}     | ${PricePatterns.unknown}
    //             ${'decreasing'}  | ${PricePatterns.decreasing}
    //         `('should store pattern as $pattern if response is $response', async ({ response, pattern }) => {
    //             message.instance.content = response;
    //             await continueWelcomeQuestions(mockRedis, user, message.instance, userRepoInstance);
    //             expect(user.previousPattern).toBe(pattern);
    //             verify(userRepo.repository.save(anything())).once();
    //         });

    //         it('should mark user as been welcomed when complete', async () => {
    //             message.instance.content = 'fluctuating';
    //             await continueWelcomeQuestions(mockRedis, user, message.instance, userRepoInstance);
    //             expect(user.hasBeenWelcomed).toBe(true);
    //         });

    //         it('should reply and not mark user as welcomed if does not understand response', async () => {
    //             message.instance.content = 'what';
    //             await continueWelcomeQuestions(mockRedis, user, message.instance, userRepoInstance);
    //             expect(user.hasBeenWelcomed).toBe(undefined);
    //         });

    //         it('should clear welcome key and last message key for user if message is understood', async () => {
    //             message.instance.content = 'fluctuating';
    //             await continueWelcomeQuestions(mockRedis, user, message.instance, userRepoInstance);
    //             expect(await mockRedis.get(`welcome:${user.id}`)).toBe(null);
    //             expect(await mockRedis.get(`welcome:${user.id}:last_message`)).toBe(null);
    //         });
    //     });
    // });
});
