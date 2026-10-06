// One place to change.
export const CONTACTS = {
  instagramHandle: 'kinomat.sk',
  email: 'info@kinomat.sk',
}

export function toInstagramHref(): string {
  return `https://www.instagram.com/${CONTACTS.instagramHandle}/`
}

export function toMailHref(): string {
  return `mailto:${CONTACTS.email}`
}
