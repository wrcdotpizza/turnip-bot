import express from 'express';
import { buildRouter as sqlRoutes } from './routes/sql-routes';

(async (): Promise<void> => {
    const app = express();

    const server = app.listen(3000, () => {
        console.log('Server is running on port 80');
    });

    const sqlRouter = await sqlRoutes();
    app.use('/sql', sqlRouter);

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
