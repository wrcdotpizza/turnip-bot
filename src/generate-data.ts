import { User } from './entity/user';
import { TurnipWeek } from './entity/turnip-week';
import { TurnipPrice, PriceDay, PriceWindow } from './entity/turnip-price';
import { Connection } from 'typeorm';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import { DiscordServer } from './entity/discord-server';

const getName = (): string => uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });

const createUser = (server: DiscordServer): User => {
    const newUser = new User();
    newUser.name = getName();
    newUser.discordServers = [server];
    return newUser;
};

const createWeekForUser = (user: User): TurnipWeek => {
    const newWeek = new TurnipWeek();
    newWeek.islandPrice = Math.floor(Math.random() * 40 + 80);
    newWeek.user = user;
    return newWeek;
};

const createTurnipPrice = (week: TurnipWeek, day: PriceDay, window: PriceWindow): TurnipPrice => {
    const newPrice = new TurnipPrice();
    newPrice.price = Math.floor(Math.random() * 600 + 20);
    newPrice.day = day;
    newPrice.priceWindow = window;
    newPrice.turnipWeek = week;
    return newPrice;
};

const createPricesForWeek = (week: TurnipWeek): Array<TurnipPrice> => {
    const pricesToCreate = [];

    for (let day = PriceDay.monday; day <= PriceDay.saturday; day++) {
        const morningPrice = createTurnipPrice(week, day, PriceWindow.am);
        const afternoonPrice = createTurnipPrice(week, day, PriceWindow.pm);
        pricesToCreate.push(morningPrice, afternoonPrice);
    }

    return pricesToCreate;
};

export const generateData = async (
    connection: Connection,
    { numUsers, numWeeks }: { numUsers: number; numWeeks: number },
): Promise<void> => {
    console.log('GENERATING Relational Data');
    const serverRepository = connection.getRepository(DiscordServer);
    const weekRepository = connection.getRepository(TurnipWeek);
    const priceRepository = connection.getRepository(TurnipPrice);
    const userRepository = connection.getRepository(User);

    const userCount = await userRepository.count();
    if (userCount > 30) {
        // Don't endlessly generate data
        return;
    }

    const server = new DiscordServer();
    server.name = getName();
    server.serverId = getName();

    await serverRepository.save(server);

    const itemsToCreate: { users: Array<User>; weeks: Array<TurnipWeek>; prices: Array<TurnipPrice> } = {
        users: [],
        weeks: [],
        prices: [],
    };

    for (let i = 0; i < numUsers; i++) {
        const user = createUser(server);
        itemsToCreate.users.push(user);
        for (let j = 0; j < numWeeks; j++) {
            const week = createWeekForUser(user);
            itemsToCreate.weeks.push(week);
            const prices = createPricesForWeek(week);
            itemsToCreate.prices.push(...prices);
        }
    }

    await userRepository.save(itemsToCreate.users);
    await weekRepository.save(itemsToCreate.weeks);
    await priceRepository.save(itemsToCreate.prices);
};
