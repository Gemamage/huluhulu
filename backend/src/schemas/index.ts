// 統一導出所有 schemas
export type * from "./auth";
export type * from "./pet";
export type * from "./search";
export type * from "./common";
export type * from "./ai";
export type * from "./upload";

// 重新導出 schema 對象
export {
  emailSchema,
  passwordSchema,
  phoneSchema,
  nameSchema,
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
  passwordResetSchema,
  forgotPasswordSchema,
  verifyEmailParamsSchema,
  resendVerificationEmailSchema
} from "./auth";

export {
  petSchema,
  createPetSchema,
  updatePetSchema,
  petQuerySchema
} from "./pet";

export {
  searchQuerySchema,
  advancedSearchSchema
} from "./search";

export {
  paginationSchema,
  sortSchema
} from "./common";

export {
  aiAnalysisSchema,
  breedPredictionSchema
} from "./ai";

export {
  fileUploadSchema,
  imageUploadSchema
} from "./upload";

// 重新導出驗證中介軟體
export {
  validateRequest,
  validateQuery,
  validateParams,
  validateFile,
} from "../utils/validation";
