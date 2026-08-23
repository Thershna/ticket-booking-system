const API_BASE_URL =
    import.meta.env.VITE_API_URL;

const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const apiRequest = async (
    endpoint,
    options = {},
    requireAuth = true,
    retries = 2
) => {
    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {})
    };

    if (requireAuth && token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (options.body) {
        headers["Content-Type"] = "application/json";
    }

    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Something went wrong."
                );
            }

            return data;

        } catch (error) {
            lastError = error;

            if (attempt < retries) {
                await sleep(500);
            }
        }
    }

    throw lastError;
};


// =========================
// AUTH
// =========================

export const login = (
    email,
    password
) =>
    apiRequest(
        "/auth/login",
        {
            method: "POST",
            body: JSON.stringify({
                email,
                password
            })
        },
        false
    );


export const register = (
    name,
    email,
    password,
    role = "CUSTOMER"
) =>
    apiRequest(
        "/auth/register",
        {
            method: "POST",
            body: JSON.stringify({
                name,
                email,
                password,
                role
            })
        },
        false,
        0
    );


// =========================
// PUBLIC EVENTS
// =========================

export const getEvents = () =>
    apiRequest(
        "/events",
        {},
        false
    );


export const getEvent = (id) =>
    apiRequest(
        `/events/${id}`,
        {},
        false
    );


export const getEventSeats = (id) =>
    apiRequest(
        `/events/${id}/seats`,
        {},
        false
    );



export const generateEventSeats = (eventId, data) =>
    apiRequest(
        `/events/${eventId}/seats`,
        {
            method: "POST",
            body: JSON.stringify(data)
        },
        true
    );

// =========================
// BOOKINGS
// =========================

export const holdSeats = (
    eventId,
    eventSeatIds
) =>
    apiRequest(
        `/events/${eventId}/hold`,
        {
            method: "POST",
            body: JSON.stringify({
                eventSeatIds
            })
        },
        true
    );


export const confirmBooking = (
    eventId,
    eventSeatIds
) =>
    apiRequest(
        `/events/${eventId}/confirm`,
        {
            method: "POST",
            body: JSON.stringify({
                eventSeatIds
            })
        },
        true
    );

export const joinWaitlist = (
    eventId,
    category
) =>
    apiRequest(
        `/events/${eventId}/waitlist`,
        {
            method: "POST",
            body: JSON.stringify({
                category
            })
        },
        true
    );


export const acceptWaitlistOffer = (
    offerId
) =>
    apiRequest(
        `/waitlist/offers/${offerId}/accept`,
        {
            method: "POST"
        },
        true
    );


export const getMyBookings = () =>
    apiRequest(
        "/my",
        {},
        true
    );
export const getBookingById = (bookingId) =>
    apiRequest(
        `/${bookingId}`,
        {},
        true
    );

export const cancelBooking = (bookingId) =>
    apiRequest(
        `/${bookingId}/cancel`,
        {
            method: "PATCH"
        },
        true
    );


export const getBooking = (id) =>
    apiRequest(
        `/bookings/${id}`,
        {},
        true
    );
export const getOrganiserEvents = () =>
    apiRequest(
        "/events/organiser/my-events",
        {},
        true
    );

export const getVenues = () =>
    apiRequest(
        "/venues",
        {},
        true
    );

export const createEvent = (data) =>
    apiRequest(
        "/events",
        {
            method: "POST",
            body: JSON.stringify(data)
        },
        true
    );

export const openEvent = (eventId) =>
    apiRequest(
        `/events/${eventId}/open`,
        {
            method: "PATCH"
        },
        true
    );

export const getMyWaitlistOffers = () =>
    apiRequest(
        "/waitlist/my-offers",
        {},
        true
    );

export default apiRequest;