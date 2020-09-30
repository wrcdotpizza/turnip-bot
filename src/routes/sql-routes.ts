import express, { Router } from 'express';
import { TurnipWeek } from '../entity/turnip-week';
import { User } from '../entity/user';
import { TurnipPrice } from '../entity/turnip-price';
import { generateData } from '../generate-data';
import { Connection } from 'typeorm';

export const buildRouter = async (connection: Connection): Promise<Router> => {
    await generateData(connection, { numUsers: 100, numWeeks: 5 });
    const userRepository = connection.getRepository(User);
    const weekRepository = connection.getRepository(TurnipWeek);
    const priceRepository = connection.getRepository(TurnipPrice);

    const sqlRouter = express.Router();

    // GET Weeks for User: /user/ < userId > /turnip-week
    sqlRouter.get('/user/:id/turnip-week', async (req, res) => {
        const userId = req.params.id;
        const user = await userRepository.findOne({ id: userId });
        const weeks = await weekRepository.find({ user });
        res.json({ weeks: weeks.map(w => ({ weekId: w.id, price: w.islandPrice })) });
    });

    // POST Week for User: /user/<userId>/turnip-week
    sqlRouter.post('/user/:id/turnip-week', async (req, res) => {
        const userId = req.params.id;
        const user = await userRepository.findOne({ id: userId });
        const newWeek = new TurnipWeek();
        newWeek.user = user;
        newWeek.islandPrice = req.body.price;
        await weekRepository.save(newWeek);
        res.json({ week: { weekId: newWeek.id, price: newWeek.islandPrice } });
    });

    // GET Turnip Prices: /user/<userId >/turnip-week/<weekId>/turnip-prices
    sqlRouter.get('/user/:id/turnip-week/:weekId/turnip-prices', async (req, res) => {
        const userId = req.params.id;
        const weekId = req.params.weekId;

        const user = await userRepository.findOne({ id: userId });
        const week = await weekRepository.findOne({ id: weekId, user });

        if (week === undefined) {
            res.status(404).json({ message: 'Not found' });
        } else {
            const prices = await priceRepository.find({ turnipWeek: week });
            res.json({
                prices: prices.map(p => ({
                    priceId: p.id,
                    price: p.price,
                    day: p.day,
                    window: p.priceWindow,
                })),
            });
        }
    });

    // POST /user/:id/turnip-week/:weekId/turnip-prices
    sqlRouter.post('/user/:id/turnip-week/:weekId/turnip-prices', async (req, res) => {
        const userId = req.params.id;
        const weekId = req.params.weekId;
        const user = await userRepository.findOne({ id: userId });
        const week = await weekRepository.findOne({ id: weekId, user });

        const { price, window, day } = req.body;
        const newPrice = new TurnipPrice();
        newPrice.turnipWeek = week;
        newPrice.price = price;
        newPrice.priceWindow = window;
        newPrice.day = day;
        await priceRepository.save(newPrice);
        res.json({ priceId: newPrice.id });
    });

    // GET /report
    sqlRouter.get('/report', async (_, res) => {
        // Return { report: [{ day: enum, averagePrice: float }] }
        const pricesQuery = priceRepository
            .createQueryBuilder('price')
            .select(['AVG(price.price) as "avgPrice"', 'price.day', 'price.priceWindow'])
            .groupBy('day, "priceWindow"');
        const results = await pricesQuery.getRawMany();
        res.json({
            report: results
                .sort((x, y) => x.price_day - y.price_day)
                .map(p => ({
                    day: p.price_day,
                    priceWindow: p.price_priceWindow,
                    averagePrice: parseFloat(p.avgPrice),
                })),
        });
    });

    return sqlRouter;
};
