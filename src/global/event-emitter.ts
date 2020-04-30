import { EventEmitter } from 'events';
import { MessageEvent } from '../types/turnip-events';

const eventEmitter = new EventEmitter();

// interface TypedEventEmitter<T> {
//     on<K extends keyof T>(s: string, listener: (v: T[K]) => Promise<void> | void): this;
//     emit<K extends keyof T>(s: string, arg: T[K]): boolean;
//     removeAllListeners(): void;
// }

interface MessageEventEmitter {
    on(s: string, listener: (v: MessageEvent) => Promise<void> | void): this;
    emit(s: string, arg: MessageEvent): boolean;
    removeAllListeners(): void;
}

export const getEventEmitter = (): MessageEventEmitter => eventEmitter;
