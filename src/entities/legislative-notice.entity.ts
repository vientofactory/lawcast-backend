import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('legislative_notices')
export class LegislativeNotice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  num: number;

  @Column('text')
  subject: string;

  @Column()
  proposerCategory: string;

  @Column()
  committee: string;

  @Column({ default: 0 })
  numComments: number;

  @Column('text')
  link: string;

  @Column({ default: false })
  isNotified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
