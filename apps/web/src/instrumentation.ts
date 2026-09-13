export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertServerEnv } = await import("@tirajeh/shared")
    assertServerEnv()
  }
}
