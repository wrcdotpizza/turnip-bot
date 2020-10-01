// @ts-nocheck
import express, { Router } from 'express';
import { formatISO } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { connectToDynamo, connectToDocumentClient } from '../helpers/connect-to-db';
import { generateData } from '../generate-dynamo-data';
import { Connection } from 'typeorm';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

interface PriceInfo {
    priceId: string;
    price: number;
    day: number;
    window: string;
}

export const buildRouter = async (sqlConnection: Connection): Promise<Router> => {
    const dynamoClient = connectToDynamo();
    const documentClient = connectToDocumentClient();

    await generateData(dynamoClient, sqlConnection, { numUsers: 100, numWeeks: 5 });

    const noSqlRouter = express.Router();

    // GET Weeks for User: /user/ < userId > /turnip-week
    noSqlRouter.get('/user/:id/turnip-week', async (req, res) => {
        const userId = req.params.id;
        const params: DocumentClient.QueryInput = {
            TableName: 'TurnipWeek',
            // Fields to return
            ProjectionExpression: 'weekId, islandPrice',
            ExpressionAttributeValues: {
                ':u': userId,
            },
            KeyConditionExpression: 'userId = :u',
        };
        const response = await documentClient.query(params).promise();
        const weeks = response.Items?.map(({ weekId, islandPrice }) => ({
            weekId,
            price: parseFloat(islandPrice),
        }));
        res.json({ weeks });
    });

    // POST Week for User: /user/<userId>/turnip-week
    noSqlRouter.post('/user/:id/turnip-week', async (req, res) => {
        const userId = req.params.id;
        const islandPrice = req.body.price;
        const weekId = uuid();
        const createdDate = formatISO(new Date());
        const params: DocumentClient.PutItemInput = {
            TableName: 'TurnipWeek',
            Item: {
                weekId: weekId,
                userId: userId,
                createdDate: createdDate,
                islandPrice: islandPrice,
                prices: [],
            },
        };
        await documentClient.put(params).promise();
        res.json({ week: { weekId, price: islandPrice } });
    });

    noSqlRouter.get('/user/:id/turnip-week/:weekId/turnip-prices', async (req, res) => {
        const userId = req.params.id;
        const weekId = req.params.weekId;
        const params: DocumentClient.GetItemInput = {
            TableName: 'TurnipWeek',
            Key: {
                userId,
                weekId
            },
        };
        const response = await documentClient.get(params).promise();
        if (response.Item === undefined) {
            res.status(404).json({ message: 'Not found' });
            return;
        }
        const prices = response.Item.prices.map(({priceId, price, day, window}: PriceInfo) => {
            return {
                priceId,
                price,
                day,
                window,
            };
        });
        res.json({ prices });
    });

    noSqlRouter.post('/user/:id/turnip-week/:weekId/turnip-prices', async (req, res) => {
        const userId = req.params.id;
        const weekId = req.params.weekId;
        const price = req.body.price;
        const day = req.body.day;
        const window = req.body.window;
        const priceId = uuid();
        const priceInfo = {
            priceId,
            price,
            day,
            window,
        }
        console.log("HERE TOO", userId);
        const params: DocumentClient.UpdateItemInput = {
            TableName: 'TurnipWeek',
            Key: { weekId, userId },
            UpdateExpression: "SET #prices = list_append(#prices, :prices)",
            ExpressionAttributeNames: {"#prices": "prices"},
            ExpressionAttributeValues: { ":prices": [priceInfo] }
        }
        await documentClient.update(params).promise();
        res.json({ priceId });
    });

    noSqlRouter.get('/report', async (_, res) => {
        let params: DocumentClient.ScanInput = {
            TableName: 'TurnipWeek',
        }
        let previousKey;
        let data = [];
        do {
            const reqParams = {...params, previousKey};
            const response = await documentClient.scan(params).promise();
            response.Items!.forEach(row => data.push(...row.prices));
            previousKey = response.LastEvaluatedKey;
        } while(previousKey);

        const totals = data.reduce((acc, current) => {
            const { day, price, window } = current;
            acc[day][window]['count'] += 1;
            acc[day][window]['total'] += price;
            return acc;
        }, {
            0: { am: {count: 0, total: 0}, pm: {count: 0, total: 0}},
            1: { am: {count: 0, total: 0}, pm: {count: 0, total: 0}},
            2: { am: {count: 0, total: 0}, pm: {count: 0, total: 0}},
            3: { am: {count: 0, total: 0}, pm: {count: 0, total: 0}},
            4: { am: {count: 0, total: 0}, pm: {count: 0, total: 0}},
            5: { am: {count: 0, total: 0}, pm: {count: 0, total: 0}},
        });

        const report = [];
        Object.entries(totals).forEach(([day, windows]) => {
            const am = {
                day: parseInt(day),
                priceWindow: "am",
                averagePrice: windows.am.total / windows.am.count
            }
            const pm = {
                day: parseInt(day),
                priceWindow: "pm",
                averagePrice: windows.pm.total / windows.pm.count
            }
            report.push(am);
            report.push(pm);
        })

        res.json({ report });
    });

    return noSqlRouter;
};
