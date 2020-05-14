import IORedis from 'ioredis';
import { User } from '../../entity/user';
import { Messages } from '../../types/messages';

export class PersonalMessageState {
    constructor(private redis: IORedis.Redis, private user: User) {}

    public async getLastMessage(): Promise<Messages | null> {
        return (await this.redis.get(this.lastMessageKey())) as Messages | null;
    }

    public async setLastMessage(message: Messages): Promise<void> {
        const messageKey = this.lastMessageKey();
        await this.redis.set(messageKey, message);
    }

    public async enqueueMessage(message: Messages): Promise<void> {
        console.log(`Enqueueing message ${message} for user ${this.user.id}`);
        await this.redis.lpush(this.messageQueueKey(), message);
    }

    public async dequeueMessage(): Promise<Messages | null> {
        return (await this.redis.rpop(this.messageQueueKey())) as Messages;
    }

    public async unsetLastMessage(): Promise<void> {
        const messageKey = this.lastMessageKey();
        await this.redis.unlink(messageKey);
    }

    private lastMessageKey(): string {
        return `user:${this.user.id}:last_message`;
    }

    private messageQueueKey(): string {
        return `user:${this.user.id}:message_queue`;
    }
}
