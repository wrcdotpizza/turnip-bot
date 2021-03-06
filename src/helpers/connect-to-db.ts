import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { createConnection, Connection } from 'typeorm';

export const connectToDb = async (maxRetries = 10, currentRetryNumber = 0, timeout = 3000): Promise<Connection> => {
    if (currentRetryNumber > maxRetries) {
        throw new Error('Failed to connect to database in time');
    }

    try {
        return await createConnection();
    } catch (error) {
        console.info('Failed to connect to database. Retrying...');
        await new Promise(res => setTimeout(res, timeout));
        return await connectToDb(maxRetries, currentRetryNumber++, timeout);
    }
};

export const connectToDynamo = (): DynamoDB => {
    return new DynamoDB({
        endpoint: 'http://dynamodb:8000',
        region: 'us-east-1',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        sslEnabled: false,
    });
};

export const connectToDocumentClient = (): DocumentClient => {
    return new DynamoDB.DocumentClient({
            endpoint: 'http://dynamodb:8000',
            region: 'us-east-1',
            accessKeyId: 'key',
            secretAccessKey: 'secret',
            sslEnabled: false,
        });
}