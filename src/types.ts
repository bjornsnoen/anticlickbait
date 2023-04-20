export interface ErrorMessage {
  success: false
  error: string
}

export interface SuccessMessage {
  success: true
  heading?: string
  subheading?: string
  ingress?: string
  byline?: string
}

export type ServiceWorkerResponse = ErrorMessage | SuccessMessage

export interface ServiceWorkerRequest {
  checkIfUrlExists: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isUrlRequest = (message: any): message is ServiceWorkerRequest => {
  return 'checkIfUrlExists' in message
}
