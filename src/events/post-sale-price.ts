import { getEventEmitter } from '../global/event-emitter';
import { MessageEvent } from '../types/turnip-events';
import { getRedis } from '../global/redis-store';
import Redis from 'ioredis';
import { withRedis } from '../helpers/with-redis';
import { SalePrice } from '../commands/sale-price';
import { PersonalMessageState } from '../messages/message-helpers/personal-message-state';
import { Messages } from '../types/messages';

export const reminderImplementation = async (redis: Redis.Redis, { msg, user }: MessageEvent): Promise<void> => {
    const messageState = new PersonalMessageState(redis, user);
    if (user.hasPurchasedTurnipsOnIsland) {
        return;
    }
    await msg.author.send(
        'Hey there, it looks like you just had another Sunday with Daisy Mae. Have you purchased turnips on your own island yet? This helps you get the most accurate predictions when using `/turnip-predict`',
    );
    await messageState.setLastMessage(Messages.updateHasPurchased);
};

export const sendTurnipPurchaseReminder = withRedis(reminderImplementation, getRedis());

getEventEmitter().on(`post ${SalePrice.command}`, sendTurnipPurchaseReminder);
