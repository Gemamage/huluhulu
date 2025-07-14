import { User, IUser } from '../models/User';

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).exec();
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }

  async update(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, userData, { new: true }).exec();
  }

  async delete(id: string): Promise<IUser | null> {
    return User.findByIdAndDelete(id).exec();
  }

  async findAll(): Promise<IUser[]> {
    return User.find().exec();
  }

  async findByEmailVerificationToken(token: string): Promise<IUser | null> {
    return User.findOne({ emailVerificationToken: token }).exec();
  }

  async findByPasswordResetToken(token: string): Promise<IUser | null> {
    return User.findOne({ passwordResetToken: token }).exec();
  }



  async verifyEmail(id: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      id,
      {
        isEmailVerified: true,
        emailVerificationToken: undefined
      },
      { new: true }
    ).exec();
  }

  async deactivate(id: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).exec();
  }

  async findWithPagination(query: any, options: {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ users: IUser[]; total: number }> {
    const { page, limit, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;
    
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      User.countDocuments(query),
    ]);
    
    return { users, total };
  }

  async findByPasswordResetTokenWithExpiry(token: string): Promise<IUser | null> {
    return User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires').exec();
  }

  // 管理員功能相關方法
  async countDocuments(filter: any = {}): Promise<number> {
    return User.countDocuments(filter).exec();
  }

  async findWithSelect(filter: any, select: string, options?: any): Promise<IUser[]> {
    let query = User.find(filter).select(select);
    
    if (options?.sort) {
      query = query.sort(options.sort);
    }
    
    if (options?.skip) {
      query = query.skip(options.skip);
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return query.exec();
  }

  async findByIdWithSelect(id: string, select: string): Promise<IUser | null> {
    return User.findById(id).select(select).exec();
  }

  async updateWithValidation(id: string, updateData: any): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires').exec();
  }

  async softDelete(id: string, email: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, {
      isActive: false,
      email: `deleted_${Date.now()}_${email}`,
    }).exec();
  }

  async updatePassword(id: string, password: string): Promise<IUser | null> {
    const user = await User.findById(id);
    if (user) {
      user.password = password;
      await user.save();
      return user;
    }
    return null;
  }

  async getStatistics(): Promise<{
    total: number;
    active: number;
    verified: number;
    admins: number;
    recent: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, active, verified, admins, recent] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isEmailVerified: true }),
      User.countDocuments({ role: { $in: ['admin', 'moderator'] } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    return { total, active, verified, admins, recent };
  }

  // 清理過期驗證令牌
  async cleanupExpiredTokens(): Promise<{ deletedCount: number }> {
    const now = new Date();
    const result = await User.updateMany(
      {
        $or: [
          {
            emailVerificationExpires: { $lt: now },
            emailVerificationToken: { $exists: true, $ne: null }
          },
          {
            passwordResetExpires: { $lt: now },
            passwordResetToken: { $exists: true, $ne: null }
          }
        ]
      },
      {
        $unset: {
          emailVerificationToken: 1,
          emailVerificationExpires: 1,
          passwordResetToken: 1,
          passwordResetExpires: 1
        }
      }
    );

    return { deletedCount: result.modifiedCount };
  }
}