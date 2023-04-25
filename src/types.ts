import { z } from 'zod'

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

export const NewsArticleSchema = z.object({
  '@type': z.string(),
  headline: z.string(),
  datePublished: z.string(),
  dateModified: z.string(),
  wordCount: z.number(),
  articleSection: z.string(),
  description: z.string(),
  keywords: z.string(),
  image: z.object({
    '@context': z.string(),
    '@type': z.string(),
    url: z.string(),
    width: z.number(),
    height: z.number(),
  }),
  publisher: z.object({
    '@context': z.string(),
    '@type': z.string(),
    name: z.string(),
    url: z.string(),
    foundingDate: z.string(),
    legalName: z.string(),
    logo: z.object({
      '@type': z.string(),
      '@context': z.string(),
      url: z.string(),
      width: z.number(),
      height: z.number(),
    }),
    sameAs: z.array(z.string()),
    publishingPrinciples: z.string(),
    masthead: z.string(),
    ethicsPolicy: z.string(),
    correctionsPolicy: z.string(),
    ownershipFundingInfo: z.string(),
  }),
  author: z.array(
    z.object({
      '@type': z.string(),
      name: z.string(),
      description: z.string(),
      url: z.string(),
    }),
  ),
  mainEntityOfPage: z.string(),
  isAccessibleForFree: z.boolean(),
  '@context': z.string(),
  mentions: z.array(
    z.object({
      '@context': z.string(),
      '@type': z.string(),
      url: z.string(),
      name: z.string(),
    }),
  ),
})

export type IPartialNewsArticle = z.infer<typeof NewsArticleSchema>
