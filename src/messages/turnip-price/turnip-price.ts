import { PriceWindow, PriceDay, PriceDayForString } from '../../entity/turnip-price';

const MessageRegex = /^\/turnip-price (\d{1,3}) (am|pm) (monday|tuesday|wednesday|thursday|friday|saturday)$/;

export const isTurnipPriceMessage = (messageContent: string): boolean => {
    return MessageRegex.test(messageContent);
};

export interface TurnipPriceMessageValues {
    price: number;
    priceWindow: PriceWindow;
    day: PriceDay;
}

export const parseTurnipMessage = (messageContent: string): TurnipPriceMessageValues => {
    const matches = MessageRegex.exec(messageContent.toLowerCase());
    if (matches === null) {
        throw new Error('Parsing turnip price message failed, this should not be possible');
    }
    matches.shift();
    const [price, priceWindow, day] = matches;
    return {
        price: parseInt(price, 10),
        priceWindow: priceWindow as PriceWindow,
        day: PriceDayForString[day],
    };
};
