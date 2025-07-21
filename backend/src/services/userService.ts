// 重構後的用戶服務 - 模組化架構
// 原始文件已備份為 userService-backup.ts

export {
  UserService,
  userService,
} from "./users";

export type {
  RegisterUserData,
  LoginUserData,
  UpdateUserData,
  AdminUpdateUserData,
  UserQueryOptions,
  UserListResult,
} from "./users";

// 為了向後兼容，也導出默認實例
import { userService } from "./users";
export default userService;
