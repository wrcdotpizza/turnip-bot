import { PriceWindow, PriceDay, PriceDayForString } from '../../entity/turnip-price';

const MessageRegex = /^\/price (\d{1,3}) (am|pm) (monday|tuesday|wednesday|thursday|friday|saturday)$/;

export const isTurnipPriceMessage = (messageContent: string): boolean => {
    return MessageRegex.test(messageContent);
};

export const parseTurnipMessage = (
    messageContent: string,
): { price: number; priceWindow: PriceWindow; day: PriceDay } => {
    const matches = MessageRegex.exec(messageContent);
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
