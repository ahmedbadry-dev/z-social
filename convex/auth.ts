import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import { betterAuth } from "better-auth/minimal"
import { magicLink, emailOTP } from "better-auth/plugins"
import { Resend } from "resend"
import { query } from "./_generated/server"
import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import authConfig from "./auth.config"

const siteUrl = process.env.SITE_URL!
const resend = new Resend(process.env.AUTH_RESEND_KEY)

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: user.email,
          subject: "Reset your password",
          html: `<p>Click <a href="${url}">here</a> to reset your password</p>`,
        })
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    plugins: [
      convex({ authConfig }),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await resend.emails.send({
            from: process.env.EMAIL_FROM!,
            to: email,
            subject: "Sign in to Social",
            html: `<a href="${url}">Click here to sign in</a>`,
          })
        },
      }),
      emailOTP({
        otpLength: 4,
        expiresIn: 300,
        sendVerificationOTP: async ({ email, otp }) => {
          await resend.emails.send({
            from: process.env.EMAIL_FROM!,
            to: email,
            subject: "Your verification code",
            html: `<p>Your code is: <strong>${otp}</strong></p>`,
          })
        },
      }),
    ],
  })
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await authComponent.getAuthUser(ctx)
    } catch {
      return null
    }
  },
})
