import { getEventEmitter } from '../global/event-emitter';
import { MessageEvent } from '../types/turnip-events';
import { getRedis } from '../global/redis-store';
import { Messages } from '../messages/messages';
import Redis from 'ioredis';
import { withRedis } from '../helpers/with-redis';

const sendTurnipPurchaseReminder = withRedis(async (redis: Redis.Redis, { msg, user }: MessageEvent): Promise<void> => {
    if (user.hasPurchasedTurnipsOnIsland) {
        return;
    }
    await msg.author.send(
        'Hey there, it looks like you just had another Sunday with Daisy Mae. Have you purchased turnips on your own island yet? This helps you get the most accurate predictions when using `/turnip-predict`',
    );
    await redis.set(`${user.id}:last_message`, Messages.updateHasPurchased);
}, getRedis());

getEventEmitter().on('postSalePrice', sendTurnipPurchaseReminder);
