import { DynamoDB } from 'aws-sdk';
import { CreateTableInput } from 'aws-sdk/clients/dynamodb';
// import { User } from './entity/user';
// import { TurnipWeek } from './entity/turnip-week';
// import { TurnipPrice, PriceDay, PriceWindow } from './entity/turnip-price';
// import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
// import { DiscordServer } from './entity/discord-server';

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

// const getName = (): string => uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] });

// const createUser = (server: DiscordServer): User => {};

// const createWeekForUser = (user: User): TurnipWeek => {};

// const createTurnipPrice = (week: TurnipWeek, day: PriceDay, window: PriceWindow): TurnipPrice => {};

// const createPricesForWeek = (week: TurnipWeek): Array<TurnipPrice> => {};

export const generateData = async (
    connection: DynamoDB,
    { numUsers, numWeeks }: { numUsers: number; numWeeks: number },
): Promise<void> => {
    console.log('IN GENERATE!', numUsers, numWeeks);
    try {
        await createUserTable(connection);
        await createTurnipWeekTable(connection);
    } catch (e) {
        console.log('OH NO~!', e);
    }
};
