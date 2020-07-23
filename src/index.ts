import express from 'express';
import { connectToDb } from './helpers/connect-to-db';
import { TurnipWeek } from './entity/turnip-week';
import { User } from './entity/user';
import { TurnipPrice } from './entity/turnip-price';

(async (): Promise<void> => {
    const connection = await connectToDb();
    const userRepository = connection.getRepository(User);
    const weekRepository = connection.getRepository(TurnipWeek);
    const priceRepository = connection.getRepository(TurnipPrice);

    const app = express();

    // GET Weeks for User: /user/ < userId > /turnip-week
    app.get('/user/:id/turnip-week', async (req, res) => {
        const userId = parseInt(req.params.id);
        const user = await userRepository.findOne({ id: userId });
        const weeks = await weekRepository.find({ user });
        res.json({ weeks: weeks.map(w => ({ weekId: w.id, price: w.islandPrice })) });
    });

    // POST Week for User: /user/<userId>/turnip-week
    app.post('/user/:id/turnip-week', async (req, res) => {
        const userId = parseInt(req.params.id);
        const user = await userRepository.findOne({ id: userId });
        const newWeek = new TurnipWeek();
        newWeek.user = user;
        newWeek.islandPrice = req.body.price;
        await weekRepository.save(newWeek);
        res.json({ week: { weekId: newWeek.id, price: newWeek.islandPrice } });
    });

    // GET Turnip Prices: /user/<userId >/turnip-week/<weekId>/turnip-prices
    app.get('/user/:id/turnip-week/:weekId/turnip-prices', async (req, res) => {
        const userId = parseInt(req.params.id);
        const user = await userRepository.findOne({ id: userId });
        const weekId = parseInt(req.params.weekId);
        const week = await weekRepository.findOne({ id: weekId, user });

        if (week === undefined) {
            res.status(404).json({ message: 'Not found' });
        } else {
            const prices = week.turnipPrices || [];
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
    app.post('/user/:id/turnip-week/:weekId/turnip-prices', async (req, res) => {
        const userId = parseInt(req.params.id);
        const weekId = parseInt(req.params.weekId);
        const user = await userRepository.findOne({ id: userId });
        const week = await weekRepository.findOne({ id: weekId, user });

        const { price, priceWindow, day } = req.body;
        const newPrice = new TurnipPrice();
        newPrice.turnipWeek = week;
        newPrice.price = price;
        newPrice.priceWindow = priceWindow;
        newPrice.day = day;
        await priceRepository.save(newPrice);
        res.json({ priceId: price.id });
    });

    // GET /report
    app.get('/report', async (_, res) => {
        // Return { report: [{ day: enum, averagePrice: float }] }
        const pricesQuery = priceRepository
            .createQueryBuilder('price')
            .select('SUM(price.price)', 'avgPrice')
            .groupBy('day, "priceWindow"');
        const results = await pricesQuery.getRawMany();
        res.json({
            report: results.map(p => ({ day: p.day, priceWindow: p.priceWindow, averagePrice: p.avgPrice })),
        });
    });

    const server = app.listen(3000, () => {
        console.log('Server is running on port 80');
    });

    server.on('error', err => {
        console.error('An error occurred', err);
    });

    // CAPTURE APP TERMINATION / RESTART EVENTS
    // To be called when process is restarted or terminated
    const gracefulShutdown = (msg: string, callback: () => void): void => {
        console.log('Shutting down server for ' + msg);
        callback();
        server.close();
    };
    // For nodemon restarts
    process.once('SIGUSR2', function () {
        gracefulShutdown('nodemon restart', function () {
            process.kill(process.pid, 'SIGUSR2');
        });
    });
    // For app termination
    process.on('SIGINT', () => {
        gracefulShutdown('app termination', function () {
            process.exit(0);
        });
    });
    // For Heroku app termination
    process.on('SIGTERM', () => {
        gracefulShutdown('Heroku app termination', function () {
            process.exit(0);
        });
    });
})().then(err => console.error(err));
