import { User } from '../src/entity/user';
import { Message, User as DiscordUser, Collection, MessageMentions } from 'discord.js';
import { mock, instance, when, anything, deepEqual } from 'ts-mockito';
import { Connection } from 'typeorm';
import { TurnipWeek } from '../src/entity/turnip-week';
import { PredictPrice } from '../src/commands/predict-price';
import { TurnipPrice, PriceWindow, PriceDay } from '../src/entity/turnip-price';
import { addMockRepository, MockRepository } from './helpers/get-mock-repository';
import { getMockTurnipPrice } from './helpers/get-mock-turnip-price';
import { PATTERN } from '../src/commands/models/prediction-link-builder';
import { getReplyMessage } from './helpers/get-reply-message';
import { Parse } from './helpers/parse';
import { PricePatterns } from '../src/types/price-patterns';

fdescribe('Predict command', () => {
    let user: User;
    let message: Message;
    let mockAuthor: DiscordUser;
    let mockMessage: Message;
    let mockConnection: Connection;
    let predictCommand: PredictPrice;
    let mockTurnipWeekRepository: MockRepository<TurnipWeek>;
    let mockTurnipPriceRepository: MockRepository<TurnipPrice>;
    let mockUserRepository: MockRepository<User>;

    beforeEach(() => {
        mockMessage = mock(Message);
        message = instance(mockMessage);
        mockAuthor = mock(DiscordUser);
        message.author = instance(mockAuthor);
        user = new User();
        mockConnection = mock(Connection);
        mockTurnipWeekRepository = addMockRepository(mockConnection, TurnipWeek);
        mockTurnipPriceRepository = addMockRepository(mockConnection, TurnipPrice);
        mockUserRepository = addMockRepository(mockConnection, User);
        when(mockTurnipPriceRepository.queryBuilder.getMany()).thenResolve([new TurnipPrice()]);
        predictCommand = new PredictPrice(instance(mockConnection));
    });

    describe('Command validation', () => {
        it.each`
            messageContent       | result
            ${'/turnip-predict'} | ${true}
        `('should return $result if message is "$messageContent"', async ({ messageContent, result }) => {
            message.content = messageContent;
            const isValid = await predictCommand.validate(message, user);
            expect(isValid).toBe(result);
        });
    });

    describe('Command execution', () => {
        beforeEach(() => {
            message.content = '/turnip-predict';
        });

        describe('Mention functionality', () => {
            const getMockDiscordUser = (): DiscordUser => instance(mock(DiscordUser));
            it.only('should return prediction info for user that was mentioned', async () => {
                const discordId = '9999';
                const mockDiscordUser = getMockDiscordUser();
                mockDiscordUser.id = discordId;
                message.mentions = ({
                    users: new Collection<string, DiscordUser>([[discordId, mockDiscordUser]]),
                } as unknown) as MessageMentions;

                const userForDiscordUser = new User();
                user.previousPattern = PricePatterns.fluctuating;
                user.hasPurchasedTurnipsOnIsland = true;
                when(mockUserRepository.repository.findOne(deepEqual({ discordId }))).thenResolve(userForDiscordUser);
                when(
                    mockTurnipWeekRepository.repository.findOne(deepEqual({ user: userForDiscordUser, active: true })),
                ).thenResolve(new TurnipWeek());
                when(mockTurnipPriceRepository.queryBuilder.getMany()).thenResolve([new TurnipPrice()]);
                await predictCommand.execute(message, user);

                const messageReplyContent = getReplyMessage(mockMessage);
                const predictUrl = Parse.getLinkFromMessage(messageReplyContent);
                expect(predictUrl.query['pattern']).toBe(PATTERN.FLUCTUATING.toString());
                expect(predictUrl.query['first']).toBe(false.toString());
            });

            it('should return prediction info for user of message if no mention is provided', async () => {
                user.previousPattern = PricePatterns.largeSpike;
                user.hasPurchasedTurnipsOnIsland = true;
                when(mockTurnipWeekRepository.repository.findOne(anything())).thenResolve(new TurnipWeek());
                when(mockTurnipPriceRepository.queryBuilder.getMany()).thenResolve([new TurnipPrice()]);
                await predictCommand.execute(message, user);

                const messageReplyContent = getReplyMessage(mockMessage);
                const predictUrl = Parse.getLinkFromMessage(messageReplyContent);
                expect(predictUrl.query['pattern']).toBe(PATTERN.LARGE_SPIKE.toString());
                expect(predictUrl.query['first']).toBe(false.toString());
            });

            it('should reply with special message if mentioned user is not found', async () => {
                const discordId = '9999';
                const mockDiscordUser = getMockDiscordUser();
                mockDiscordUser.id = discordId;
                message.mentions = ({
                    users: new Collection<string, DiscordUser>([[discordId, mockDiscordUser]]),
                } as unknown) as MessageMentions;
                when(mockUserRepository.repository.findOne(deepEqual({ discordId }))).thenResolve(undefined);
                await predictCommand.execute(message, user);

                const messageReplyContent = getReplyMessage(mockMessage);
                expect(messageReplyContent).toBe("Sorry, I don't have any turnip market data for that user.");
            });
        });

        describe('Prediction Url', () => {
            describe('?first', () => {
                beforeEach(() => {
                    when(mockTurnipWeekRepository.repository.findOne({ user, active: true })).thenResolve(
                        new TurnipWeek(),
                    );
                });

                it('should set "first" query parameter to true if user has not bought turnips on their island', async () => {
                    user.hasPurchasedTurnipsOnIsland = true;
                    await predictCommand.execute(message, user);

                    const messageReplyContent = getReplyMessage(mockMessage);
                    const predictUrl = Parse.getLinkFromMessage(messageReplyContent);
                    expect(predictUrl.query['first']).toBe('false');
                });

                it('should set "first" query parameter to false if user has not bought turnips on their island', async () => {
                    user.hasPurchasedTurnipsOnIsland = false;
                    await predictCommand.execute(message, user);

                    const messageReplyContent = getReplyMessage(mockMessage);
                    const predictUrl = Parse.getLinkFromMessage(messageReplyContent);
                    expect(predictUrl.query['first']).toBe('true');
                });
            });

            describe('?pattern', () => {
                it.each`
                    previousPattern              | result
                    ${PricePatterns.fluctuating} | ${PATTERN.FLUCTUATING}
                    ${PricePatterns.decreasing}  | ${PATTERN.DECREASING}
                    ${PricePatterns.largeSpike}  | ${PATTERN.LARGE_SPIKE}
                    ${PricePatterns.smallSpike}  | ${PATTERN.SMALL_SPIKE}
                    ${PricePatterns.unknown}     | ${-1}
                `(
                    'should set ?pattern=$result if previousPattern is "$previousPattern"',
                    async ({ previousPattern, result }) => {
                        user.previousPattern = previousPattern;
                        await predictCommand.execute(message, user);

                        const messageReplyContent = getReplyMessage(mockMessage);
                        const predictUrl = Parse.getLinkFromMessage(messageReplyContent);
                        expect(predictUrl.query['pattern']).toBe(result.toString());
                    },
                );
            });

            describe('?prices with TurnipWeek', () => {
                let turnipWeek: TurnipWeek;

                beforeEach(() => {
                    turnipWeek = new TurnipWeek();
                    turnipWeek.islandPrice = 111;
                    when(mockTurnipWeekRepository.repository.findOne(anything())).thenResolve(turnipWeek);
                });

                it('should include the islandPrice', async () => {
                    when(mockTurnipPriceRepository.queryBuilder.getMany()).thenResolve([
                        new TurnipPrice(),
                        new TurnipPrice(),
                        new TurnipPrice(),
                    ]);
                    await predictCommand.execute(message, user);

                    const messageReplyContent = getReplyMessage(mockMessage);
                    const predictUrl = Parse.getLinkFromMessage(messageReplyContent);
                    const parsedPrices = predictUrl.query['prices']?.split('.');
                    expect(parsedPrices && parsedPrices[0]).toBe(
                        turnipWeek.islandPrice && turnipWeek.islandPrice.toString(),
                    );
                });

                it('should build link for prices of the week', async () => {
                    const prices = [
                        getMockTurnipPrice(PriceWindow.am, PriceDay.monday),
                        getMockTurnipPrice(PriceWindow.pm, PriceDay.monday),
                        getMockTurnipPrice(PriceWindow.am, PriceDay.tuesday),
                        getMockTurnipPrice(PriceWindow.pm, PriceDay.tuesday),
                        getMockTurnipPrice(PriceWindow.am, PriceDay.wednesday),
                    ];
                    when(mockTurnipPriceRepository.queryBuilder.getMany()).thenResolve(prices);
                    await predictCommand.execute(message, user);

                    const messageReplyContent = getReplyMessage(mockMessage);
                    const predictUrl = Parse.getLinkFromMessage(messageReplyContent);
                    expect(predictUrl).toBeTruthy();
                });
            });

            describe('?prices without TurnipWeek', () => {
                beforeEach(() => {
                    when(mockTurnipWeekRepository.repository.findOne(anything())).thenResolve(undefined);
                });

                it('should ignore the islandPrice first', async () => {
                    const prices = [
                        getMockTurnipPrice(PriceWindow.am, PriceDay.monday),
                        getMockTurnipPrice(PriceWindow.pm, PriceDay.monday),
                        getMockTurnipPrice(PriceWindow.am, PriceDay.tuesday),
                        getMockTurnipPrice(PriceWindow.pm, PriceDay.friday),
                        getMockTurnipPrice(PriceWindow.am, PriceDay.saturday),
                    ];
                    when(mockTurnipPriceRepository.queryBuilder.getMany()).thenResolve(prices);
                    await predictCommand.execute(message, user);

                    const messageReplyContent = getReplyMessage(mockMessage);
                    const predictUrl = Parse.getLinkFromMessage(messageReplyContent);
                    const parsedPrices = predictUrl.query['prices']?.split('.');
                    expect(parsedPrices && parsedPrices[0]).toBe('');
                });
            });
        });
    });
});
