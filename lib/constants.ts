export const BUSINESS_NAME = 'Heavenly Arbor Care Services'
export const BUSINESS_CITY = 'San Antonio, TX'
export const BUSINESS_PHONE = process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '(210) 815-5498'
export const BUSINESS_PHONE_TEL = `+1${(process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '2108155498').replace(/\D/g, '')}`
