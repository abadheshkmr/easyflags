import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToOne } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('user_preferences')
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  userId: string;

  @OneToOne(() => UserEntity, user => user.preferences)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ default: false })
  darkMode: boolean;

  @Column({ default: true })
  emailNotifications: boolean;

  @Column({ type: 'jsonb', nullable: true })
  uiSettings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 