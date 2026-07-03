// Fetches the daily USD -> UZS rate from the Central Bank of Uzbekistan (cbu.uz).
// The endpoint is public and needs no auth. Returns the number of so'm per 1 USD,
// or 0 if unavailable (callers treat 0 as "rate unknown").

export async function getUsdRate(): Promise<number> {
  try {
    const res = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/", {
      // Refresh at most once per hour; the CBU rate changes at most daily.
      next: { revalidate: 3600 },
    })
    if (!res.ok) return 0
    const data = (await res.json()) as Array<{ Rate?: string }>
    const rate = Number.parseFloat(data?.[0]?.Rate ?? "")
    return Number.isFinite(rate) && rate > 0 ? rate : 0
  } catch {
    return 0
  }
}
