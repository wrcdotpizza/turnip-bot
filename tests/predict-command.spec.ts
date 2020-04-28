import { User } from '../src/entity/user';
import { Message, User as DiscordUser } from 'discord.js';
import { mock, instance, when, capture, anyString, verify, anything } from 'ts-mockito';
import { Connection } from 'typeorm';
import { TurnipWeek } from '../src/entity/turnip-week';
import { PredictPrice, PATTERN } from '../src/commands/predict-price';
import UrlParser from 'url-parse';
import { TurnipPrice, PriceWindow, PriceDay } from '../src/entity/turnip-price';
import { addMockRepository, MockRepository } from './helpers/get-mock-repository';
import { PricePatterns } from '../src/messages/setup/setup';
import { getMockTurnipPrice } from './helpers/get-mock-turnip-price';

const UrlRegex = /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/;

const getLinkFromMessage = (messageContent: string): UrlParser => {
    const url = UrlRegex.exec(messageContent);
    if (url === null) {
        fail('Could not find url in message');
    }
    return UrlParser(url[0], true);
};

const getReplyMessage = (message: Message): string => {
    verify(message.reply(anyString())).once();
    const [replyContent] = capture(message.reply).last();
    return replyContent as string;
};

fdescribe('Predict command', () => {
    let user: User;
    let message: Message;
    let mockAuthor: DiscordUser;
    let mockMessage: Message;
    let mockConnection: Connection;
    let predictCommand: PredictPrice;
    let mockTurnipWeekRepository: MockRepository<TurnipWeek>;
    let mockTurnipPriceRepository: MockRepository<TurnipPrice>;

    beforeEach(() => {
        mockMessage = mock(Message);
        message = instance(mockMessage);
        mockAuthor = mock(DiscordUser);
        message.author = instance(mockAuthor);
        user = new User();
        mockConnection = mock(Connection);
        mockTurnipWeekRepository = addMockRepository(mockConnection, TurnipWeek);
        mockTurnipPriceRepository = addMockRepository(mockConnection, TurnipPrice);
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
                    const predictUrl = getLinkFromMessage(messageReplyContent);
                    expect(predictUrl.query['first']).toBe('false');
                });

                it('should set "first" query parameter to false if user has not bought turnips on their island', async () => {
                    user.hasPurchasedTurnipsOnIsland = false;
                    await predictCommand.execute(message, user);

                    const messageReplyContent = getReplyMessage(mockMessage);
                    const predictUrl = getLinkFromMessage(messageReplyContent);
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
                        const predictUrl = getLinkFromMessage(messageReplyContent);
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

                it('should return the islandPrice first', async () => {
                    when(mockTurnipPriceRepository.queryBuilder.getMany()).thenResolve([
                        new TurnipPrice(),
                        new TurnipPrice(),
                        new TurnipPrice(),
                    ]);
                    await predictCommand.execute(message, user);

                    const messageReplyContent = getReplyMessage(mockMessage);
                    const predictUrl = getLinkFromMessage(messageReplyContent);
                    const parsedPrices = predictUrl.query['prices']?.split('.');
                    expect(parsedPrices && parsedPrices[0]).toBe(
                        turnipWeek.islandPrice && turnipWeek.islandPrice.toString(),
                    );
                });

                it('should place the prices in the correct order', async () => {
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
                    const predictUrl = getLinkFromMessage(messageReplyContent);
                    const parsedPrices = predictUrl.query['prices']?.split('.');
                    expect(parsedPrices?.length).toBe(13);
                    const expectedPrices = [turnipWeek.islandPrice, ...prices.map(p => p.price!)].map(i =>
                        i?.toString(),
                    );
                    expect(parsedPrices?.slice(0, expectedPrices.length)).toEqual(expectedPrices);
                });

                it('should put empty prices for not included dates', async () => {
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
                    const predictUrl = getLinkFromMessage(messageReplyContent);
                    const expectedPrices = [
                        turnipWeek.islandPrice,
                        prices[0].price,
                        prices[1].price,
                        prices[2].price,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        prices[3].price,
                        prices[4].price,
                        undefined,
                    ];
                    expect(predictUrl.query['prices']).toEqual(expectedPrices.join('.'));
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
                    const predictUrl = getLinkFromMessage(messageReplyContent);
                    const parsedPrices = predictUrl.query['prices']?.split('.');
                    expect(parsedPrices && parsedPrices[0]).toBe('');
                });

                it('should the prices in the correct position', async () => {
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
                    const predictUrl = getLinkFromMessage(messageReplyContent);
                    const parsedPrices = predictUrl.query['prices']?.split('.');
                    expect(parsedPrices?.length).toBe(13);
                    const expectedPrices = ['', ...prices.map(p => p.price!)].map(i => i?.toString());
                    expect(parsedPrices?.slice(0, expectedPrices.length)).toEqual(expectedPrices);
                });
            });
        });
    });
});
