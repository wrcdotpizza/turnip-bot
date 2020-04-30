describe('welcomeIslandPurchase handler', () => {
    //     describe('Last message was "islandPurchase"', () => {
    //         beforeEach(async () => {
    //             await mockRedis.set(`welcome:${user.id}:last_message`, Messages.welcomeIslandPurchase);
    //         });

    //         it.each(['yes', 'yup', 'yeah', 'yee', 'yea'])(
    //             'should store hasPurchasedTurnipsOnIsland as true when answered "%p"',
    //             async value => {
    //                 message.instance.content = value;
    //                 await continueWelcomeQuestions(mockRedis, user, message.instance, userRepoInstance);
    //                 expect(user.hasPurchasedTurnipsOnIsland).toBe(true);
    //                 verify(userRepo.repository.save(user)).once();
    //                 expect(await mockRedis.get(`welcome:${user.id}:last_message`)).toBe(Messages.welcomePattern);
    //             },
    //         );

    //         it.each(['no', 'Nope', 'nah', 'nay', 'NO'])(
    //             'should store hasPurchasedTurnipsOnIsland as false when answered "%p"',
    //             async value => {
    //                 message.instance.content = value;
    //                 await continueWelcomeQuestions(mockRedis, user, message.instance, userRepoInstance);
    //                 expect(user.hasPurchasedTurnipsOnIsland).toBe(false);
    //                 verify(userRepo.repository.save(user)).once();
    //                 expect(await mockRedis.get(`welcome:${user.id}:last_message`)).toBe(Messages.welcomePattern);
    //             },
    //         );

    //         it('should reply with a message if does not understand response and not save user', async () => {
    //             message.instance.content = 'What';
    //             await continueWelcomeQuestions(mockRedis, user, message.instance, userRepoInstance);
    //             verify(message.mock.reply(anyString())).once();
    //             expect(user.hasPurchasedTurnipsOnIsland).toBe(undefined);
    //         });
    //     });

    //TODO: Have it just run `update-has-purchased.spec.ts`?
    it('should reply with error if answer is not understood', async () => {
        fail();
    });

    it('should not set last message to welcomePattern if answer is not understood', async () => {
        fail();
    });

    it('should return false if reply is not understood', async () => {
        fail();
    });

    it('should update hasPurchasedTurnipsOnIsland to true if answer is yes', async () => {
        fail();
    });

    it('should update hasPurchasedTurnipsOnIsland to false if answer is false', async () => {
        fail();
    });

    it('should send new questions when answer is understood', async () => {
        fail();
    });

    it('should set last message to welcomePattern if answer is understood', async () => {
        fail();
    });
});
