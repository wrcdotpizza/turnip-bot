import { handleYesOrNoAnswer, YesOrNoResponse, handleEnumAnswer } from '../src/messages/answer-handlers';

describe.only('answer handlers', () => {
    describe('handleEnumAnswer', () => {
        enum TestEnum {
            firstAnswer = 'first answer',
            secondAnswer = 'secondanswer',
            thirdAnswer = 'what',
        }
        it.each`
            text                     | result
            ${TestEnum.firstAnswer}  | ${TestEnum.firstAnswer}
            ${TestEnum.secondAnswer} | ${TestEnum.secondAnswer}
            ${'unknown'}             | ${null}
            ${TestEnum.thirdAnswer}  | ${TestEnum.thirdAnswer}
        `('should return $result if text is "$text"', ({ text, result }) => {
            const answer = handleEnumAnswer<TestEnum>(text, TestEnum);
            expect(answer).toBe(result);
        });
    });

    describe('handleYesOrNoAnswer', () => {
        it.each`
            text        | result
            ${'yes'}    | ${YesOrNoResponse.yes}
            ${'Yeah'}   | ${YesOrNoResponse.yes}
            ${'yup'}    | ${YesOrNoResponse.yes}
            ${'yea'}    | ${YesOrNoResponse.yes}
            ${'YES'}    | ${YesOrNoResponse.yes}
            ${'no'}     | ${YesOrNoResponse.no}
            ${'nope'}   | ${YesOrNoResponse.no}
            ${'nay'}    | ${YesOrNoResponse.no}
            ${'Nah'}    | ${YesOrNoResponse.no}
            ${'Yee'}    | ${YesOrNoResponse.yes}
            ${'uhhh'}   | ${YesOrNoResponse.unknown}
            ${'banana'} | ${YesOrNoResponse.unknown}
        `('should return $result if text is "$text"', ({ text, result }) => {
            const answer = handleYesOrNoAnswer(text);
            expect(answer).toBe(result);
        });
    });
});
