import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { Client, User as Author, Message } from 'discord.js';
import { createConnection, Repository } from 'typeorm';
import { User } from './entity/user';
import Redis from 'ioredis';
import { beginWelcomeConversation, isInWelcomeAndIsDm, continueWelcomeQuestions } from './messages/setup/setup';
import { StorePrice } from './commands/store-price';
import { SalePrice } from './commands/sale-price';
import { Command } from './commands/command';
import { PredictPrice } from './commands/predict-price';
import { DiscordServer } from './entity/discord-server';
dotenv.config();

const getOrCreateUserForMessageAuthor = async (
    repository: Repository<User>,
    author: Author,
): Promise<{ user: User; isNewUser: boolean }> => {
    let user: User | undefined;
    let isNewUser = false;
    user = await repository.findOne({ discordId: author.id });
    if (!user) {
        isNewUser = true;
        user = new User();
        user.name = author.username;
        user.discordId = author.id;
        await repository.save(user);
    }
    return { user, isNewUser };
};

const getOrCreateDiscordServer = async (
    repository: Repository<DiscordServer>,
    message: Message,
): Promise<DiscordServer | null> => {
    if (!message.guild) {
        return null;
    }
    const { id: serverId, name } = message.guild;
    let server: DiscordServer | undefined;
    server = await repository.findOne({ serverId });
    if (!server) {
        server = new DiscordServer();
        server.serverId = serverId;
        server.name = name;
        await repository.save(server);
    }
    return server;
};

const client = new Client();
const redis = new Redis({ host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT || '6379') });

(async (): Promise<void> => {
    const connection = await createConnection();
    const userRepository = connection.getRepository(User);
    const serverRepository = connection.getRepository(DiscordServer);

    const commands: { [key: string]: Command } = {
        [StorePrice.command]: new StorePrice(redis, connection),
        [SalePrice.command]: new SalePrice(redis, connection),
        [PredictPrice.command]: new PredictPrice(connection),
    };

    client.on('ready', () => {
        if (client.user) {
            console.log(`Logged in as ${client.user.tag}!`);
        }
    });

    client.on('message', msg => {
        (async (): Promise<void> => {
            if (msg.author.bot) return;

            const { user, isNewUser } = await getOrCreateUserForMessageAuthor(userRepository, msg.author);
            const server = await getOrCreateDiscordServer(serverRepository, msg);

            if (server) {
                user.discordServers = [...(user.discordServers || []), server];
                await userRepository.save(user);
            }

            if (isNewUser) {
                await beginWelcomeConversation(redis, user, msg);
                return;
            }

            if (await isInWelcomeAndIsDm(redis, user, msg)) {
                await continueWelcomeQuestions(redis, user, msg, userRepository);
                return;
            }

            if (/^(\/\w+)/.test(msg.content)) {
                const command = /^(\/\w+)/.exec(msg.content)?.pop();
                if (command && command in commands) {
                    const handler = commands[command];
                    console.log(`Detected command ${command}. Running validation`);
                    if (await handler.validate(msg, user)) {
                        console.log(`Running ${command} handler for user ${user.id}`);
                        await handler.execute(msg, user);
                    }
                }
            }
        })();
    });

    client.login(process.env.DISCORD_TOKEN);

    // CAPTURE APP TERMINATION / RESTART EVENTS
    // To be called when process is restarted or terminated
    const gracefulShutdown = (msg: string, callback: () => void): void => {
        console.log('Shutting down server for ' + msg);
        client.removeAllListeners();
        callback();
        connection.close();
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
