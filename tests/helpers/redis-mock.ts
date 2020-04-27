/* eslint-disable @typescript-eslint/ban-ts-ignore */
import * as IORedis from 'ioredis';
// @ts-ignore
import RedisMock from 'ioredis-mock';

export const GetMockRedisClient = (): IORedis.Redis => new RedisMock() as IORedis.Redis;
