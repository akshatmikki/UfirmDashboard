const API_URL = "https://api.urest.in:8096/GetAllCity";

export async function getAllCities() {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error("Failed to load city list");

    return await response.json();
  } catch (error) {
    console.error("City fetch error:", error);
    throw error;
  }
}

export async function createOrGetCity(model) {
  const response = await fetch("https://api.urest.in:8096/CreateOrGetCity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(model),
  });

  if (!response.ok) {
    throw new Error("Failed to create/get city");
  }

  return response.json();
}