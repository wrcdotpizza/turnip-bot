import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { buildRouter as sqlRoutes } from './routes/sql-routes';
import { buildRouter as noSqlRoutes } from './routes/nosql-routes';
import { connectToDb } from './helpers/connect-to-db';
console.log("CHECK");
(async (): Promise<void> => {
    const app = express();
    const connection = await connectToDb();
    const sqlRouter = await sqlRoutes(connection);
    const noSqlRouter = await noSqlRoutes(connection);
    app.use(cors());
    app.use(bodyParser.json());
    app.use('/sql', sqlRouter);
    app.use('/nosql', noSqlRouter);

    app.use((req, res, next) => {
        const origin = req.get('origin');
        console.log('IN THIS GLOBAL THING', cors);
        console.log('CORS!', cors);
        // TODO Add origin validation
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.header(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma',
        );

        // intercept OPTIONS method
        if (req.method === 'OPTIONS') {
            res.sendStatus(204);
        } else {
            next();
        }
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
