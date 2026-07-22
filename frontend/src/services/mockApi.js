import noticesSeed from '../data/notices.json'

const wait = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = (data) => JSON.parse(JSON.stringify(data))

let noticesStore = clone(noticesSeed)

export async function getNotices() {
  await wait()
  return clone(noticesStore)
}

export async function createNotice(payload) {
  await wait(300)
  const newNotice = {
    id: Date.now(),
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    ...payload,
  }
  noticesStore = [newNotice, ...noticesStore]
  return clone(newNotice)
}
