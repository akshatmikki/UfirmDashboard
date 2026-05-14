import axios from "axios";

// const API_URL = "https://api.urest.in:8096/";
const API_URL = "http://localhost:62929/";


// SAVE ONBOARDING TEMP DATA

export const saveOnboardingTemp = async (model) => {
    try {
        const response = await fetch(`${API_URL}api/onboarding/temp`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(model),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error saving onboarding temp data:", error);
        throw error;
    }
};

// GET ONBOARDING TEMP DATA
// =====================================
export const getOnboardingTemp = async (propertyId = 0) => {
    try {
        const response = await fetch(
            `${API_URL}api/onboarding/temp?propertyId=${propertyId}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching onboarding temp data:", error);
        throw error;
    }
};

// =====================================
// UPDATE ONBOARDING TEMP DATA
// =====================================

export const updateOnboardingTemp = async (tempId, model) => {
    try {
        const response = await fetch(
            `${API_URL}api/onboarding/temp/${tempId}`,
            {
                method: "PUT",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(model),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData?.Message || "Failed to update employee");
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating onboarding temp data:", error);
        throw error;
    }
};


