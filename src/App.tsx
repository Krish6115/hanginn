import { StrictMode, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteGuard } from "@/components/RouteGuard";
import { BottomNav } from "@/components/BottomNav";

// Eagerly load the landing page for fast first paint
import Index from "./pages/Index.tsx";

// Lazy-load all other pages — they're heavy with Supabase queries and Framer Motion
const RoomVenues = lazy(() => import("./pages/RoomVenues.tsx"));
const ProfileEntry = lazy(() => import("./pages/ProfileEntry.tsx"));
const VerifyPresence = lazy(() => import("./pages/VerifyPresence.tsx"));
const DigitalRoom = lazy(() => import("./pages/DigitalRoom.tsx"));
const MyCircle = lazy(() => import("./pages/MyCircle.tsx"));
const Notifications = lazy(() => import("./pages/Notifications.tsx"));
const MyProfile = lazy(() => import("./pages/MyProfile.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/** Minimal loading fallback matching the Quiet Luxury aesthetic */
function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
        <p className="text-xs text-muted-foreground font-body font-light tracking-wide">
          Loading…
        </p>
      </div>
    </div>
  );
}

const App = () => (
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/rooms/:roomType" element={<RoomVenues />} />
                <Route path="/rooms/:roomType/join" element={
                  <RouteGuard requireVenue>
                    <ProfileEntry />
                  </RouteGuard>
                } />
                <Route path="/rooms/:roomType/verify" element={
                  <RouteGuard requireVenue>
                    <VerifyPresence />
                  </RouteGuard>
                } />
                <Route path="/rooms/:roomType/live" element={
                  <RouteGuard requireProfile requireVenue requireGeofence>
                    <DigitalRoom />
                  </RouteGuard>
                } />
                <Route path="/circle" element={<MyCircle />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<MyProfile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <BottomNav />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);

export default App;
