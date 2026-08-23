import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import SeatSelection from "./pages/SeatSelection";
import BookingSuccess from "./pages/BookingSuccess";
import MyBookings from "./pages/MyBookings";
import BookingDetails from "./pages/BookingDetails";
import OrganiserDashboard from "./pages/OrganiserDashboard";
import CreateEvent from "./pages/CreateEvent";
import ManageSeats from "./pages/ManageSeats";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                 <Route
                    path="/verify-email/:token"
                    element={<VerifyEmail />}
                />

                <Route
                    path="/events"
                    element={<Events />}
                />

                <Route
                    path="/events/:id"
                    element={<EventDetails />}
                />

                <Route
                    path="/events/:id/seats"
                    element={<SeatSelection />}
                />

                <Route
                    path="/booking-success/:id"
                    element={<BookingSuccess />}
                />

                <Route
                    path="/bookings"
                    element={<MyBookings />}
                />

                <Route
                    path="/bookings/:bookingId"
                    element={<BookingDetails />}
                />

                <Route
                    path="/organiser/dashboard"
                    element={<OrganiserDashboard />}
                />

                <Route
                    path="/organiser/events/create"
                    element={<CreateEvent />}
                />
                <Route
                    path="/organiser/events/:eventId/seats"
                    element={<ManageSeats />}
                />
              

            </Routes>

        </BrowserRouter>
    );
}

export default App;