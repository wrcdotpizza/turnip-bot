import { PersonalMessageState } from '../messages/message-helpers/personal-message-state';

export function withMessageState<T = void>(
    fn: (redis: PersonalMessageState, ...args: Array<any>) => T | Promise<T>,
    redis: PersonalMessageState,
) {
    return (...args: Array<any>): Promise<T> | T => {
        return fn(redis, ...args);
    };
}
