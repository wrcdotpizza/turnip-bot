const MessageRegex = /^\/sale (\d{1,3})$/;

export const isSalePriceMessage = (messageContent: string): boolean => {
    return MessageRegex.test(messageContent);
};

export const parseSalePriceMessage = (messageContent: string): { price: number } => {
    const matches = MessageRegex.exec(messageContent);
    if (matches === null) {
        throw new Error('Parsing turnip price message failed, this should not be possible');
    }
    matches.shift();
    const [price] = matches;
    return { price: parseInt(price, 10) };
};
