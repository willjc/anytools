export async function uploadForProcessing(slug: string, file: File, extraFields?: Record<string, string>): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  for (const [key, value] of Object.entries(extraFields ?? {})) {
    formData.append(key, value);
  }

  const response = await fetch(`/api/tools/${slug}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = `服务器处理失败（HTTP ${response.status}）。`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      // Keep the generic message when the body is not JSON.
    }
    throw new Error(message);
  }

  return response.blob();
}
