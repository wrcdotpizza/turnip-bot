import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { Client, User as Author, Message } from 'discord.js';
import { createConnection, Repository, Connection } from 'typeorm';
import { User } from './entity/user';
import { beginWelcomeConversation } from './messages/welcome/welcome';
import { StorePrice } from './commands/store-price';
import { SalePrice } from './commands/sale-price';
import { Command } from './commands/command';
import { PredictPrice } from './commands/predict-price';
import { DiscordServer } from './entity/discord-server';
import { Ping } from './commands/ping';
import { Help } from './commands/help';
import { TurnipPattern } from './commands/turnip-pattern';
import { getEventEmitter } from './global/event-emitter';
import { getRedis } from './global/redis-store';
import { buildMessageHandlers } from './messages/messages';
import { PersonalMessageState } from './messages/message-helpers/personal-message-state';
import * as events from './events';
dotenv.config();
events.registerEvents();

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

const connectToDb = async (maxRetries = 10, currentRetryNumber = 0, timeout = 3000): Promise<Connection> => {
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

(async (): Promise<void> => {
    const connection = await connectToDb();
    const messageHandlers = buildMessageHandlers();
    const userRepository = connection.getRepository(User);
    const serverRepository = connection.getRepository(DiscordServer);

    const commands: { [key: string]: Command } = {
        [StorePrice.command]: new StorePrice(connection),
        [SalePrice.command]: new SalePrice(connection),
        [PredictPrice.command]: new PredictPrice(connection),
        [Ping.command]: new Ping(),
        [Help.command]: new Help(),
        [TurnipPattern.command]: new TurnipPattern(connection),
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
            const messageState = new PersonalMessageState(getRedis(), user);
            const server = await getOrCreateDiscordServer(serverRepository, msg);

            if (server) {
                user.discordServers = [...(user.discordServers || []), server];
                await userRepository.save(user);
            }

            if (isNewUser) {
                await beginWelcomeConversation(messageState, msg);
                return;
            }

            const lastMessage = await messageState.getLastMessage();
            if (msg.channel.type === 'dm' && lastMessage !== null) {
                console.log(`Running hanlder for lastMessage ${lastMessage} for user ${user.id}`);
                await messageHandlers[lastMessage]?.handler(messageState, connection, msg, user);
            } else if (/^(\/\w+)/.test(msg.content)) {
                const command = /^(\/turnip-\w+)/.exec(msg.content)?.pop();
                msg.content = msg.content.toLowerCase().trim();
                if (command && command in commands) {
                    const handler = commands[command];
                    console.log(`Detected command ${command}. Running validation`);
                    if (await handler.validate(msg, user)) {
                        console.log(`Running ${command} handler for user ${user.id}`);
                        await handler.execute(msg, user);
                        getEventEmitter().emit(`post ${command}`, { msg, user, connection, messageState });
                    } else {
                        await handler.help(msg, user);
                    }
                }
            }

            const messageToSend = await messageState.dequeueMessage();
            if (messageToSend) {
                console.log(`Dequeued ${messageToSend} for user id ${user.id}`);
                await events.fireOperationForMessage(messageToSend, { msg, user, connection, messageState });
            }
        })();
    });

    client.login(process.env.DISCORD_TOKEN);

    // CAPTURE APP TERMINATION / RESTART EVENTS
    // To be called when process is restarted or terminated
    const gracefulShutdown = (msg: string, callback: () => void): void => {
        console.log('Shutting down server for ' + msg);
        client.removeAllListeners();
        getEventEmitter().removeAllListeners();
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
