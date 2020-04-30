import { EventEmitter } from 'events';
import { TurnipEvents } from '../types/turnip-events';

const eventEmitter = new EventEmitter();

interface TypedEventEmitter<T> {
    on<K extends keyof T>(s: K, listener: (v: T[K]) => Promise<void> | void): this;
    emit<K extends keyof T>(s: K, arg: T[K]): boolean;
}

export const getEventEmitter = (): TypedEventEmitter<TurnipEvents> => eventEmitter;
