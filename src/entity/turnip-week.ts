import { Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { User } from './user';
import { TurnipPrice } from './turnip-price';

@Entity()
export class TurnipWeek {
    @PrimaryGeneratedColumn("uuid")
    id?: string;

    @CreateDateColumn()
    createdAt?: Date;

    @Column('integer', { nullable: true })
    islandPrice?: number | null;

    @Column('integer', { nullable: true })
    purchasePrice?: number | null;

    @Column({ default: true })
    active?: boolean;

    @ManyToOne(() => User)
    user?: User;

    @OneToMany(() => TurnipPrice, price => price.turnipWeek)
    turnipPrices?: Array<TurnipPrice>;
}
