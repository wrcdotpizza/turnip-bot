import AWS, { DynamoDB } from 'aws-sdk';
import { CreateTableInput } from 'aws-sdk/clients/dynamodb';
import { formatISO } from 'date-fns';
import { Connection } from 'typeorm';
import { PriceDay, PriceWindow } from './entity/turnip-price';
import { TurnipWeek } from './entity/turnip-week';

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
                AttributeName: 'userId',
                KeyType: 'HASH',
            },
            {
                AttributeName: 'weekId',
                KeyType: 'RANGE'
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5000,
            WriteCapacityUnits: 5000,
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
                    ReadCapacityUnits: 2000,
                    WriteCapacityUnits: 2000,
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

interface Week {
    weekId: string;
    userId: string;
    createdDate: string;
    islandPrice: number;
    prices: Array<Price>;
}

const createWeekForUser = (params: {
    userId: string;
    weekId: string;
    createdDate: Date;
    islandPrice: number;
    prices: Array<Price>;
}): Week => {
    return {
        weekId: params.weekId,
        userId: params.userId,
        createdDate: formatISO(params.createdDate),
        islandPrice: params.islandPrice,
        prices: params.prices,
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
    sqlConnection: Connection,
    { numUsers, numWeeks }: { numUsers: number; numWeeks: number },
): Promise<void> => {
    console.log('IN GENERATE!', numUsers, numWeeks);

    try {
        await createTurnipWeekTable(connection);
    } catch (e) {
        console.error('Error while creating tables', e);
    }

    try {
        const weekRepository = sqlConnection.getRepository(TurnipWeek);
        const weeks = await weekRepository.find({ relations: ['turnipPrices', 'user'] });
        const itemsToCreate: { weeks: Array<Week> } = {
            weeks: [],
        };

        for (const week of weeks) {
            itemsToCreate.weeks.push(
                createWeekForUser({
                    weekId: week.id?.toString()!,
                    userId: week.user?.id?.toString()!,
                    createdDate: week.createdAt!,
                    islandPrice: week.islandPrice!,
                    prices: week.turnipPrices!.map(p => ({
                        priceId: p.id?.toString()!,
                        price: p.price!,
                        window: p.priceWindow!,
                        day: p.day!,
                    })),
                }),
            );
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
        console.log('OH NO!', e);
    }
};
