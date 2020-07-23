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
