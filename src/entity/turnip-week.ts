import { Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { User } from './user';
import { TurnipPrice } from './turnip-price';

@Entity()
export class TurnipWeek {
    @PrimaryGeneratedColumn()
    id?: number;

    @CreateDateColumn()
    createdAt?: Date;

    @Column()
    islandPrice?: number;

    @Column('integer', { nullable: true })
    purchasePrice?: number | null;

    @Column({ default: true })
    active?: boolean;

    @ManyToOne(() => User)
    user?: User;

    @OneToMany(() => TurnipPrice, price => price.turnipWeek)
    turnipPrices?: Array<TurnipPrice>;
}
