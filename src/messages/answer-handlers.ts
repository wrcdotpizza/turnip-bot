import { getEnumValues } from '../helpers/get-enum-values';

enum YesOrNoResponse {
    yes,
    no,
    unknown,
}

function handleYesOrNoAnswer(messageText: string): YesOrNoResponse {
    const transformedText = messageText.toLowerCase();
    transformedText.trim();
    const affirmitiveRegex = /^([Yy]up|[Yy]eah|[Yy]es|[Yy]ee|[Yy]ea)$/;
    const negativeRegex = /^([Nn]o|[Nn]ope|[Nn]ah|[Nn]ay)$/;
    if (affirmitiveRegex.test(transformedText)) {
        return YesOrNoResponse.yes;
    } else if (negativeRegex.test(transformedText)) {
        return YesOrNoResponse.no;
    } else {
        return YesOrNoResponse.unknown;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleEnumAnswer<T>(messageText: string, answerEnum: any): T | null {
    messageText.trim();
    messageText.toLowerCase();
    const enumValues = getEnumValues<string>(answerEnum);
    const enumRegex = new RegExp(`^(${enumValues.join('|')})$`);
    if (!enumRegex.test(messageText)) {
        return null;
    }

    const matches = enumRegex.exec(messageText);

    return matches !== null ? ((matches[0] as unknown) as T) : null;
}

export { handleYesOrNoAnswer, handleEnumAnswer, YesOrNoResponse };
