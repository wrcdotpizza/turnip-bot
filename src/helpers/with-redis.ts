import IORedis from 'ioredis';

export function withRedis<T = void>(
    fn: (redis: IORedis.Redis, ...args: Array<any>) => T | Promise<T>,
    redis: IORedis.Redis,
) {
    return (...args: Array<any>): Promise<T> | T => {
        return fn(redis, ...args);
    };
}
