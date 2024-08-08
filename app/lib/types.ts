export type BackendResponseSuccess<T extends object> = {
  success: true;
  message?: string;
  data?: T;
};

export type BackendResponseError = {
  success: false;
  message: string;
  data?: never;
};

export type BackendResponse<T extends object> =
  | BackendResponseSuccess<T>
  | BackendResponseError;
