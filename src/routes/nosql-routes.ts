import express, { Router } from 'express';
import { formatISO } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { connectToDynamo } from '../helpers/connect-to-db';
import { generateData } from '../generate-dynamo-data';
import { GetItemInput, PutItemInput, QueryInput } from 'aws-sdk/clients/dynamodb';

export const buildRouter = async (): Promise<Router> => {
    const connection = connectToDynamo();
    await generateData(connection, { numUsers: 100, numWeeks: 5 });

    const noSqlRouter = express.Router();

    // GET Weeks for User: /user/ < userId > /turnip-week
    noSqlRouter.get('/user/:id/turnip-week', async (req, res) => {
        const userId = parseInt(req.params.id);
        const params: QueryInput = {
            TableName: 'TurnipWeek',
            IndexName: 'userId-index',
            // Fields to return
            ProjectionExpression: 'weekId, islandPrice',
            ExpressionAttributeValues: {
                ':u': { S: `${userId}` },
            },
            KeyConditionExpression: 'userId = :u',
        };
        const response = await connection.query(params).promise();
        const weeks = response.Items?.map(({ weekId, islandPrice }) => ({
            weekId: weekId.S,
            price: parseFloat(islandPrice.N!),
        }));
        res.json({ weeks });
    });

    // POST Week for User: /user/<userId>/turnip-week
    noSqlRouter.post('/user/:id/turnip-week', async (req, res) => {
        console.log('incoming price', req.body);
        const userId = req.params.id;
        // const islandPrice = req.body.price;
        const islandPrice = 90;
        const weekId = uuid();
        const createdDate = formatISO(new Date());
        const params: PutItemInput = {
            TableName: 'TurnipWeek',
            Item: {
                weekId: { S: weekId },
                userId: { S: userId },
                createdDate: { S: createdDate },
                islandPrice: { N: `${islandPrice}` },
                prices: { L: [] },
            },
        };
        await connection.putItem(params).promise();
        res.json({ week: { weekId, price: islandPrice } });
    });

    // GET Turnip Prices: /user/<userId >/turnip-week/<weekId>/turnip-prices
    noSqlRouter.get('/user/:id/turnip-week/:weekId/turnip-prices', async (req, res) => {
        const weekId = req.params.weekId;
        const params: GetItemInput = {
            TableName: 'TurnipWeek',
            Key: {
                weekId: { S: weekId },
            },
        };
        console.log('PARAMS', params);
        const response = await connection.getItem(params).promise();
        if (response.Item === undefined) {
            res.status(404).json({ message: 'Not found' });
            return;
        }
        const prices = response.Item.prices.L!.map(item => {
            const price = item.M!;
            return {
                priceId: price.priceId.S,
                price: parseInt(price.price.N!),
                day: parseInt(price.day.N!),
                window: price.priceWindow.S,
            };
        });
        res.json({ prices });
    });

    // POST /user/:id/turnip-week/:weekId/turnip-prices
    noSqlRouter.post('/user/:id/turnip-week/:weekId/turnip-prices', (req, res) => {
        console.log(req, res);
        // const userId = parseInt(req.params.id);
        // const weekId = parseInt(req.params.weekId);
        // const user = await userRepository.findOne({ id: userId });
        // const week = await weekRepository.findOne({ id: weekId, user });
        // const { price, priceWindow, day } = req.body;
        // const newPrice = new TurnipPrice();
        // newPrice.turnipWeek = week;
        // newPrice.price = price;
        // newPrice.priceWindow = priceWindow;
        // newPrice.day = day;
        // await priceRepository.save(newPrice);
        // res.json({ priceId: price.id });
    });

    // GET /report
    noSqlRouter.get('/report', (_, res) => {
        console.log(res);
        // // Return { report: [{ day: enum, averagePrice: float }] }
        // const pricesQuery = priceRepository
        //     .createQueryBuilder('price')
        //     .select(['AVG(price.price) as "avgPrice"', 'price.day', 'price.priceWindow'])
        //     .groupBy('day, "priceWindow"');
        // const results = await pricesQuery.getRawMany();
        // res.json({
        //     report: results
        //         .sort((x, y) => x.price_day - y.price_day)
        //         .map(p => ({
        //             day: p.price_day,
        //             priceWindow: p.price_priceWindow,
        //             averagePrice: parseFloat(p.avgPrice),
        //         })),
        // });
    });

    return noSqlRouter;
};
