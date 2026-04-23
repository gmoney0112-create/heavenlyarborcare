const GHL_API_KEY = process.env.GHL_API_KEY!
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID!
const BASE_URL = 'https://services.leadconnectorhq.com'

const headers = {
  Authorization: `Bearer ${GHL_API_KEY}`,
  'Content-Type': 'application/json',
  Version: '2021-07-28',
}

export async function sendSMS(phone: string, message: string) {
  const res = await fetch(`${BASE_URL}/conversations/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'SMS',
      locationId: GHL_LOCATION_ID,
      contactId: await getOrCreateContact(phone),
      message,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('GHL SMS error:', err)
    throw new Error(`GHL SMS failed: ${res.status}`)
  }
  return res.json()
}

export async function sendEmail(
  email: string,
  name: string,
  subject: string,
  htmlBody: string
) {
  const contactId = await getOrCreateContact(undefined, email, name)
  const res = await fetch(`${BASE_URL}/conversations/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'Email',
      locationId: GHL_LOCATION_ID,
      contactId,
      subject,
      html: htmlBody,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('GHL Email error:', err)
    throw new Error(`GHL Email failed: ${res.status}`)
  }
  return res.json()
}

async function getOrCreateContact(
  phone?: string,
  email?: string,
  name?: string
): Promise<string> {
  // Search for existing contact
  const query = phone || email
  const searchRes = await fetch(
    `${BASE_URL}/contacts/search?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(query!)}`,
    { headers }
  )
  if (searchRes.ok) {
    const data = await searchRes.json()
    if (data.contacts?.length > 0) return data.contacts[0].id
  }

  // Create new contact
  const createRes = await fetch(`${BASE_URL}/contacts/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      locationId: GHL_LOCATION_ID,
      ...(phone && { phone }),
      ...(email && { email }),
      ...(name && { firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' ') }),
    }),
  })
  const created = await createRes.json()
  return created.contact.id
}
