import IORedis from 'ioredis';
import { User } from '../../entity/user';
import { Messages } from '../messages';
import { withRedis } from '../../helpers/with-redis';
import { getRedis } from '../../global/redis-store';

export const lastMessageForUser = withRedis<Messages | null>(
    async (redis: IORedis.Redis, user: User): Promise<Messages | null> => {
        return (await redis.get(`${user.id}:last_message`)) as Messages | null;
    },
    getRedis(),
);
