export function mapIntegrationUniqueViolation(
  target: unknown,
): "ALREADY_CONNECTED" | "ACCOUNT_LINKED_ELSEWHERE" {
  const targetFields = Array.isArray(target) ? target.map(String) : [];
  const normalized = targetFields.join(" ").toLowerCase();

  if (
    targetFields.includes("instagram_professional_id") ||
    normalized.includes("instagram_professional_id")
  ) {
    return "ACCOUNT_LINKED_ELSEWHERE";
  }

  return "ALREADY_CONNECTED";
}
