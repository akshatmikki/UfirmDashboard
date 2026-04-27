const API_URL =
  "https://api.urest.in:8096/api/Asset/GetAssetRentOutReturnHistoryByAssetId";

export async function getAssetRentOutReturnHistoryByAssetId(assetId) {
  try {
    const response = await fetch(`${API_URL}?assetId=${assetId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      withCredentials: false,
    });

    if (!response.ok) {
      throw new Error("Failed to load asset rent-out / return history");
    }

    return await response.json();
  } catch (error) {
    console.error("Asset rent history fetch error:", error);
    throw error;
  }
}
