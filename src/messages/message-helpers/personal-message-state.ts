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

    public async unsetLastMessage(): Promise<void> {
        const messageKey = this.lastMessageKey();
        await this.redis.unlink(messageKey);
    }

    private lastMessageKey(): string {
        return `user:${this.user.id}:last_message`;
    }
}
