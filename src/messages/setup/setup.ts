import Redis from 'ioredis';
import { User } from '../../entity/user';
import { Message } from 'discord.js';
import { Repository } from 'typeorm';

enum WelcomeMessages {
    islandPurchase = 'islandPurchase',
    pattern = 'pattern',
}

enum YesOrNoResponse {
    yes,
    no,
    unknown,
}

export enum PricePatterns {
    fluctuating = 'fluctuating',
    decreasing = 'decreasing',
    largeSpike = 'large spike',
    smallSpike = 'small spike',
    unknown = 'unkown',
}

const welcomeKeyForUser = (user: User): string => `welcome:${user.id}`;
const lastMessageKeyForUser = (user: User): string => `${welcomeKeyForUser(user)}:last_message`;

function handleYesOrNoAnswer(messageText: string): YesOrNoResponse {
    messageText.trim();
    const affirmitiveRegex = /([Yy]up|[Yy]eah|[Yy]es|[Yy]ee|[Yy]ea)/;
    const negativeRegex = /([Nn]o|[Nn]ope|[Nn]ah|[Nn]ay)/;
    if (affirmitiveRegex.test(messageText)) {
        return YesOrNoResponse.yes;
    } else if (negativeRegex.test(messageText)) {
        return YesOrNoResponse.no;
    } else {
        return YesOrNoResponse.unknown;
    }
}

function handleEnumAnswer<T>(messageText: string, answerEnum: any): T | null {
    messageText.trim();
    messageText.toLowerCase();
    const enumValues = Object.keys(answerEnum)
        .filter(k => typeof answerEnum[k as any] === 'string')
        .map(k => answerEnum[k as any]);
    const enumRegex = new RegExp(`^(${enumValues.join('|')})$`);
    if (!enumRegex.test(messageText)) {
        return null;
    }

    const matches = enumRegex.exec(messageText);

    return matches !== null ? ((matches[0] as unknown) as T) : null;
}

export async function beginWelcomeConversation(redis: Redis.Redis, user: User, msg: Message): Promise<void> {
    await redis.set(welcomeKeyForUser(user), 1);
    await msg.author.send('Sounds like you want to start tracking your turnips. I have a few questions for you...');
    await msg.author.send('Have you purchased turnips on your island before?');
    await redis.set(`welcome:${user.id}:last_message`, WelcomeMessages.islandPurchase);
}

export async function isInWelcomeAndIsDm(redis: Redis.Redis, user: User, msg: Message): Promise<boolean> {
    if (msg.channel.type !== 'dm') {
        return false;
    }
    const welcomeKeyValue = await redis.get(welcomeKeyForUser(user));
    if (welcomeKeyValue === null || parseInt(welcomeKeyValue) === 0) {
        return false;
    }
    return true;
}

async function askForPreviousPattern(redis: Redis.Redis, user: User, msg: Message): Promise<void> {
    await msg.author.send(
        `Thanks. What was your previous turnip price pattern? (fluctuating, large spike, decreasing, small spike)`,
    );
    await msg.author.send(`If you don't know, just answer "I don't know".`);
    await redis.set(lastMessageKeyForUser(user), WelcomeMessages.pattern);
}

export async function continueWelcomeQuestions(
    redis: Redis.Redis,
    user: User,
    msg: Message,
    userRepository: Repository<User>,
): Promise<void> {
    const lastQuestion = await redis.get(lastMessageKeyForUser(user));

    switch (lastQuestion) {
        case WelcomeMessages.islandPurchase:
            const islandPurchaseResponse = handleYesOrNoAnswer(msg.content);
            if (islandPurchaseResponse === YesOrNoResponse.unknown) {
                await msg.reply("Sorry, I don't know what that means");
                return;
            }
            user.hasPurchasedTurnipsOnIsland = islandPurchaseResponse === YesOrNoResponse.yes;
            await userRepository.save(user);
            await askForPreviousPattern(redis, user, msg);
            break;
        case WelcomeMessages.pattern:
            const patternResponse = handleEnumAnswer<PricePatterns>(msg.content, PricePatterns);
            if (patternResponse === null) {
                await msg.reply("Sorry, I don't know what that means");
                return;
            }
            user.previousPattern = patternResponse;
            user.hasBeenWelcomed = true;
            await Promise.all([
                userRepository.save(user),
                msg.reply('Thank you. That is all I need to know'),
                redis.unlink(lastMessageKeyForUser(user)),
                redis.unlink(welcomeKeyForUser(user)),
            ]);
            break;
        default:
            console.error(`Unkown last question type ${lastQuestion}`);
    }
}
