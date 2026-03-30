import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import RoomVenues from "./pages/RoomVenues.tsx";
import ProfileEntry from "./pages/ProfileEntry.tsx";
import DigitalRoom from "./pages/DigitalRoom.tsx";
import MyCircle from "./pages/MyCircle.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/rooms/:roomType" element={<RoomVenues />} />
          <Route path="/rooms/:roomType/join" element={<ProfileEntry />} />
          <Route path="/rooms/:roomType/live" element={<DigitalRoom />} />
          <Route path="/circle" element={<MyCircle />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
