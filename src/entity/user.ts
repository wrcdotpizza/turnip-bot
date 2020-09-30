import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { TurnipWeek } from './turnip-week';
import { PricePatterns } from '../types/price-patterns';
import { DiscordServer } from './discord-server';

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id?: string;

    @Column()
    name?: string;

    @Column('varchar', { nullable: true, unique: true })
    discordId?: string | null;

    @OneToMany(() => TurnipWeek, week => week.user)
    turnipWeeks?: Array<TurnipWeek>;

    @Column({ default: false })
    hasPurchasedTurnipsOnIsland?: boolean;

    @Column({ default: false })
    hasBeenWelcomed?: boolean;

    @Column({
        enum: [
            PricePatterns.decreasing,
            PricePatterns.fluctuating,
            PricePatterns.largeSpike,
            PricePatterns.smallSpike,
            PricePatterns.unknown,
        ],
        default: PricePatterns.unknown,
    })
    previousPattern?: PricePatterns;

    @ManyToMany(() => DiscordServer, server => server.users, { cascade: true })
    @JoinTable()
    discordServers?: Array<DiscordServer>;
}
