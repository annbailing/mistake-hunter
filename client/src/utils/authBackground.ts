const STORAGE_KEY = 'mistake-hunter-login-bg'
export const DEFAULT_LOGIN_BG = '/images/login-bg.png'

export function getLoginBackground(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_LOGIN_BG
}

export function setLoginBackground(url: string) {
  localStorage.setItem(STORAGE_KEY, url)
}

export function resetLoginBackground() {
  localStorage.removeItem(STORAGE_KEY)
}

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
