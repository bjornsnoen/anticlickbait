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

const AuthorSchema = z.object({
  '@type': z.string(),
  name: z.string(),
  url: z.string().nullable(),
  description: z.string().nullable(),
})

type IAuthor = z.infer<typeof AuthorSchema>

const PublisherSchema = z.object({
  '@context': z.string().optional(),
  '@type': z.string(),
  name: z.string(),
  url: z.string().optional(),
  foundingDate: z.string().optional(),
  legalName: z.string().optional(),
  logo: z.object({
    '@type': z.string().optional(),
    '@context': z.string().optional(),
    url: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }),
  sameAs: z.array(z.string()).optional(),
  publishingPrinciples: z.string().optional(),
  masthead: z.string().optional(),
  ethicsPolicy: z.string().optional(),
  correctionsPolicy: z.string().optional(),
  ownershipFundingInfo: z.string().optional(),
})

export const NewsArticleSchema = z.object({
  '@type': z.string(),
  headline: z.string(),
  datePublished: z.string(),
  dateModified: z.string(),
  wordCount: z.number().optional(),
  articleSection: z.string().optional(),
  description: z.string(),
  keywords: z.string().optional(),
  image: z.union([
    z.object({
      '@context': z.string(),
      '@type': z.string(),
      url: z.string(),
      width: z.number(),
      height: z.number(),
    }),
    z.string(),
  ]),
  publisher: PublisherSchema,
  author: z.union([
    z.array(AuthorSchema),
    z.string().transform((value): IAuthor[] => [
      {
        '@type': 'Person',
        name: value,
        url: null,
        description: null,
      },
    ]),
  ]),
  mainEntityOfPage: z.string(),
  isAccessibleForFree: z.boolean().optional(),
  '@context': z.string(),
  mentions: z
    .array(
      z.object({
        '@context': z.string(),
        '@type': z.string(),
        url: z.string(),
        name: z.string(),
      }),
    )
    .optional(),
})

export type IPartialNewsArticle = z.infer<typeof NewsArticleSchema>
