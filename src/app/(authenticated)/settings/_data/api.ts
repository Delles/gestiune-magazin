import type {
    StoreInfoFormValues,
    CurrencyFormValues,
    CategoryFormValues,
} from "@/lib/validation/settings-schemas";
import type { Database } from "@/types/supabase";

// Define types locally using Database
type StoreSettings = Database["public"]["Tables"]["StoreSettings"]["Row"];
type CurrencySettings = Database["public"]["Tables"]["CurrencySettings"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

// --- Common Error Handling --- (Consider moving to a shared lib file)
async function handleApiResponse(response: Response) {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
            console.error("API Error Response:", errorData);
        } catch {
            // If response is not JSON or empty
            errorData = {
                message: `Request failed with status ${response.status}: ${response.statusText}`,
            };
        }
        // Throw an error with a message from the API response, or a default message
        throw new Error(
            errorData?.error ||
                errorData?.message ||
                "An unexpected API error occurred"
        );
    }

    // Handle cases where response might be empty (e.g., DELETE 204, or GET for non-existent single item)
    if (
        response.status === 204 ||
        response.headers.get("content-length") === "0"
    ) {
        return null; // Return null for empty successful responses
    }

    try {
        return await response.json();
    } catch (error) {
        console.error("Failed to parse JSON response:", error);
        throw new Error("Failed to parse API response.");
    }
}

// --- Categories --- (Assumes API routes are at /api/settings/categories)
export async function getCategories(): Promise<Category[]> {
    const response = await fetch("/api/settings/categories");
    const data = await handleApiResponse(response);
    // API returns Category[] or null from handleApiResponse if error/empty
    return data ?? []; // Return empty array if data is null (e.g., fetch error handled)
}

export async function createCategory(
    data: CategoryFormValues
): Promise<Category> {
    const response = await fetch("/api/settings/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    // Assuming API returns the created Category object
    return handleApiResponse(response);
}

// TODO: Implement updateCategory when PUT route exists (/api/settings/categories/[categoryId])
// export async function updateCategory(id: string, data: CategoryFormValues): Promise<Category> {
//     const response = await fetch(`/api/settings/categories/${id}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//     });
//     return handleApiResponse(response);
// }

// TODO: Implement deleteCategory when DELETE route exists (/api/settings/categories/[categoryId])
// export async function deleteCategory(id: string): Promise<void> {
//     const response = await fetch(`/api/settings/categories/${id}`, {
//         method: 'DELETE',
//     });
//     await handleApiResponse(response); // Expects 204/null
// }

// --- Store Settings --- (Assumes API route is /api/settings/store)
export async function getStoreSettings(): Promise<StoreSettings | null> {
    const response = await fetch("/api/settings/store");
    // API returns {} for not found, handleApiResponse might return null if content-length is 0
    // or it might parse {} into an object. Need to adjust based on API behavior.
    const data = await handleApiResponse(response);
    // Check if the returned data is essentially empty (like the {} from the API)
    if (data && Object.keys(data).length === 0) {
        return null;
    }
    return data;
}

export async function saveStoreSettings(
    data: StoreInfoFormValues
): Promise<StoreSettings> {
    const response = await fetch("/api/settings/store", {
        method: "POST", // API handles upsert via POST
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return handleApiResponse(response);
}

// --- Currency Settings --- (Assumes API route is /api/settings/currency)
export async function getCurrencySettings(): Promise<CurrencySettings | null> {
    const response = await fetch("/api/settings/currency");
    const data = await handleApiResponse(response);
    // Similar handling as getStoreSettings for potentially empty object response
    if (data && Object.keys(data).length === 0) {
        return null;
    }
    return data;
}

export async function saveCurrencySettings(
    data: CurrencyFormValues
): Promise<CurrencySettings> {
    const response = await fetch("/api/settings/currency", {
        method: "POST", // API handles upsert via POST
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return handleApiResponse(response);
}
