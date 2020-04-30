describe('welcomePattern handler', () => {
    it('should make gunnar implement the commented out tests', () => {
        fail();
    });
    //     describe('Last message was "pattern"', () => {
    //         beforeEach(async () => {
    //             await mockRedis.set(`welcome:${user.id}:last_message`, Messages.welcomePattern);
    //         });

    //         it.each`
    //             response         | pattern
    //             ${'fluctuating'} | ${PricePatterns.fluctuating}
    //             ${'small spike'} | ${PricePatterns.smallSpike}
    //             ${'large spike'} | ${PricePatterns.largeSpike}
    //             ${'unknown'}     | ${PricePatterns.unknown}
    //             ${'decreasing'}  | ${PricePatterns.decreasing}
    //         `('should store pattern as $pattern if response is $response', async ({ response, pattern }) => {
    //             message.instance.content = response;
    //             await continueWelcomeQuestions(mockRedis, user, message.instance, userRepoInstance);
    //             expect(user.previousPattern).toBe(pattern);
    //             verify(userRepo.repository.save(anything())).once();
    //         });

    //         it('should mark user as been welcomed when complete', async () => {
    //             message.instance.content = 'fluctuating';
    //             await continueWelcomeQuestions(mockRedis, user, message.instance, userRepoInstance);
    //             expect(user.hasBeenWelcomed).toBe(true);
    //         });

    //         it('should reply and not mark user as welcomed if does not understand response', async () => {
    //             message.instance.content = 'what';
    //             await continueWelcomeQuestions(mockRedis, user, message.instance, userRepoInstance);
    //             expect(user.hasBeenWelcomed).toBe(undefined);
    //         });

    //         it('should clear last message key for user if message is understood', async () => {
    //             message.instance.content = 'fluctuating';
    //             await continueWelcomeQuestions(mockRedis, user, message.instance, userRepoInstance);
    //             expect(await mockRedis.get(`welcome:${user.id}:last_message`)).toBe(null);
    //         });
    //     });
    // });
});
