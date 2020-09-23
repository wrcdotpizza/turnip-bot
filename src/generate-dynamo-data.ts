import AWS, { DynamoDB } from 'aws-sdk';
import { CreateTableInput } from 'aws-sdk/clients/dynamodb';
import { formatISO } from 'date-fns';
import { v4 as uuid } from 'uuid';
import { PriceDay, PriceWindow } from './entity/turnip-price';

const createUserTable = async (connection: DynamoDB): Promise<void> => {
    const userTableParams = {
        AttributeDefinitions: [
            {
                AttributeName: 'id',
                AttributeType: 'N',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'id',
                KeyType: 'HASH',
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
        TableName: 'User',
    };
    await connection.createTable(userTableParams).promise();
};

const createTurnipWeekTable = async (connection: DynamoDB): Promise<void> => {
    const turnipWeekTableParams: CreateTableInput = {
        AttributeDefinitions: [
            {
                AttributeName: 'weekId',
                AttributeType: 'S',
            },
            {
                AttributeName: 'userId',
                AttributeType: 'S',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'weekId',
                KeyType: 'HASH',
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
        TableName: 'TurnipWeek',
        GlobalSecondaryIndexes: [
            {
                IndexName: 'userId-index',
                Projection: {
                    ProjectionType: 'ALL',
                },
                KeySchema: [
                    {
                        KeyType: 'HASH',
                        AttributeName: 'userId',
                    },
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 1,
                },
            },
        ],
    };
    await connection.createTable(turnipWeekTableParams).promise();
};

interface Price {
    priceId: string;
    price: number;
    day: PriceDay;
    window: PriceWindow;
}

const createTurnipPrice = (day: PriceDay, window: PriceWindow): Price => ({
    priceId: uuid(),
    price: Math.floor(Math.random() * 100),
    day: day,
    window: window,
});

const createPricesForWeek = (): Array<Price> => {
    const pricesToCreate = [];

    for (let day = PriceDay.monday; day <= PriceDay.saturday; day++) {
        const morningPrice = createTurnipPrice(day, PriceWindow.am);
        const afternoonPrice = createTurnipPrice(day, PriceWindow.pm);
        pricesToCreate.push(morningPrice, afternoonPrice);
    }

    return pricesToCreate;
};

interface Week {
    weekId: string;
    userId: string;
    createdDate: string;
    islandPrice: number;
    prices: Array<Price>;
}

const createWeekForUser = (userId: string): Week => {
    return {
        weekId: uuid(),
        userId: userId,
        createdDate: formatISO(new Date()),
        islandPrice: 90,
        prices: createPricesForWeek(),
    };
};

function chunkArray<T>(array: Array<T>, chunkSize = 10): Array<Array<T>> {
    const chunkedArray: Array<Array<T>> = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunkedArray.push(array.slice(i, i + chunkSize));
    }
    return chunkedArray;
}

export const generateData = async (
    connection: DynamoDB,
    { numUsers, numWeeks }: { numUsers: number; numWeeks: number },
): Promise<void> => {
    console.log('IN GENERATE!', numUsers, numWeeks);

    try {
        await createUserTable(connection);
        await createTurnipWeekTable(connection);
    } catch (e) {
        console.error('Error while creating tables', e);
    }

    try {
        const itemsToCreate: { weeks: Array<Week> } = {
            weeks: [],
        };

        for (let userCount = 0; userCount < numUsers; userCount++) {
            const userId = uuid();
            for (let weekCount = 0; weekCount < numWeeks; weekCount++) {
                itemsToCreate.weeks.push(createWeekForUser(userId));
            }
        }

        const DynamoDB = new AWS.DynamoDB.DocumentClient({
            endpoint: 'http://dynamodb:8000',
            region: 'us-east-1',
            accessKeyId: 'key',
            secretAccessKey: 'secret',
            sslEnabled: false,
        });

        const batches = chunkArray(itemsToCreate.weeks, 25);

        for (const batch of batches) {
            await DynamoDB.batchWrite({
                RequestItems: {
                    TurnipWeek: batch.map(w => ({
                        PutRequest: {
                            Item: w,
                        },
                    })),
                },
            }).promise();
        }
    } catch (e) {
        console.log('OH NO~!', e);
    }
};
