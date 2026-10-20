export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { db } = await import("./lib/db");
  try {
    await db();
    console.log("[db] schema și date inițiale pregătite");
  } catch (err) {
    // Se va reîncerca automat la prima cerere.
    console.error("[db] inițializare eșuată:", err);
  }
}
