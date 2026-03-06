import { useState, useEffect, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from "@vis.gl/react-google-maps";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const StarRating = ({ rating, interactive = false, onRate }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={() => interactive && onRate && onRate(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{
            fontSize: interactive ? 22 : 14,
            cursor: interactive ? "pointer" : "default",
            color: s <= (hover || rating) ? "#F97316" : "#2a2a2a",
            transition: "color 0.15s",
          }}
        >★</span>
      ))}
    </div>
  );
};

const CourtCard = ({ court, onClick, active }) => (
  <div
    onClick={() => onClick(court)}
    style={{
      background: active ? "#0f1923" : "#0a0f14",
      border: `1px solid ${active ? "#F97316" : "#1a2530"}`,
      borderRadius: 16,
      overflow: "hidden",
      cursor: "pointer",
      transition: "all 0.2s ease",
      transform: active ? "scale(1.01)" : "scale(1)",
      boxShadow: active ? "0 0 0 2px #F97316" : "none",
      flexShrink: 0,
    }}
  >
    <div style={{ position: "relative", height: 130 }}>
      {court.photo ? (
        <img src={court.photo} alt={court.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", background: "#0f1923", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🏀</div>
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 10, right: 10, background: "#166534", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.05em" }}>
        OUTDOOR
      </div>
      <div style={{ position: "absolute", bottom: 10, left: 12, color: "#fff" }}>
        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em" }}>{court.name}</div>
      </div>
    </div>
    <div style={{ padding: "10px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StarRating rating={Math.round(court.rating || 0)} />
          <span style={{ color: "#F97316", fontWeight: 700, fontSize: 13 }}>{court.rating?.toFixed(1) || "—"}</span>
          {court.totalRatings && <span style={{ color: "#4a5568", fontSize: 12 }}>({court.totalRatings})</span>}
        </div>
        {court.distance && <span style={{ color: "#F97316", fontSize: 12, fontWeight: 600 }}>{court.distance}</span>}
      </div>
      <div style={{ color: "#64748b", fontSize: 12 }}>{court.address}</div>
    </div>
  </div>
);

const CourtDetail = ({ court, onClose, onAddReview }) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ text: "", rating: 5, user: "" });
  const [tab, setTab] = useState("reviews");
  const [reviews, setReviews] = useState(court.reviews || []);

  const handleSubmit = () => {
    if (!newReview.text || !newReview.user) return;
    const review = { ...newReview, time: "Just now", avatar: newReview.user.slice(0, 2).toUpperCase() };
    setReviews(prev => [review, ...prev]);
    onAddReview && onAddReview(court.place_id, review);
    setNewReview({ text: "", rating: 5, user: "" });
    setShowReviewForm(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#0a0f14", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #1a2530", borderBottom: "none", animation: "slideUp 0.3s ease" }}>
        <style>{`@keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        <div style={{ position: "relative", height: 200, flexShrink: 0 }}>
          {court.photo ? (
            <img src={court.photo} alt={court.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "#0f1923", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🏀</div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0a0f14 0%, transparent 60%)" }} />
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          <div style={{ position: "absolute", bottom: 16, left: 20 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: "#fff", letterSpacing: "0.05em", lineHeight: 1 }}>{court.name}</div>
            <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>{court.address}</div>
          </div>
        </div>

        <div style={{ display: "flex", padding: "14px 20px", gap: 20, borderBottom: "1px solid #1a2530", flexShrink: 0 }}>
          {[
            { label: "Rating", value: court.rating?.toFixed(1) || "—" },
            { label: "Reviews", value: court.totalRatings || reviews.length },
            { label: "Status", value: court.openNow === true ? "Open" : court.openNow === false ? "Closed" : "—" },
            { label: "Distance", value: court.distance || "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ color: "#F97316", fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.05em" }}>{value}</div>
              <div style={{ color: "#64748b", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #1a2530", flexShrink: 0, padding: "0 20px" }}>
          {["reviews", "info"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", color: tab === t ? "#F97316" : "#4a5568", fontFamily: "inherit", fontSize: 14, fontWeight: 600, padding: "10px 16px", cursor: "pointer", borderBottom: tab === t ? "2px solid #F97316" : "2px solid transparent", textTransform: "capitalize" }}>{t}</button>
          ))}
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px" }}>
          {tab === "reviews" && (
            <>
              {!showReviewForm ? (
                <button onClick={() => setShowReviewForm(true)} style={{ width: "100%", background: "#0f1923", border: "1px dashed #1e3a5f", color: "#F97316", borderRadius: 12, padding: "12px", fontFamily: "inherit", fontSize: 14, cursor: "pointer", marginBottom: 16, fontWeight: 600 }}>
                  + Write a Review
                </button>
              ) : (
                <div style={{ background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ marginBottom: 10 }}>
                    <StarRating rating={newReview.rating} interactive onRate={(r) => setNewReview(p => ({ ...p, rating: r }))} />
                  </div>
                  <input value={newReview.user} onChange={e => setNewReview(p => ({ ...p, user: e.target.value }))} placeholder="Your name" style={{ width: "100%", background: "#0a0f14", border: "1px solid #1e2d3d", borderRadius: 8, padding: "8px 12px", color: "#fff", fontFamily: "inherit", fontSize: 14, marginBottom: 8, boxSizing: "border-box" }} />
                  <textarea value={newReview.text} onChange={e => setNewReview(p => ({ ...p, text: e.target.value }))} placeholder="Share your experience..." rows={3} style={{ width: "100%", background: "#0a0f14", border: "1px solid #1e2d3d", borderRadius: 8, padding: "8px 12px", color: "#fff", fontFamily: "inherit", fontSize: 14, resize: "none", boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={handleSubmit} style={{ flex: 1, background: "#F97316", border: "none", color: "#fff", borderRadius: 8, padding: "10px", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Post Review</button>
                    <button onClick={() => setShowReviewForm(false)} style={{ background: "#0a0f14", border: "1px solid #1e2d3d", color: "#64748b", borderRadius: 8, padding: "10px 16px", fontFamily: "inherit", fontSize: 14, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}
              {reviews.length === 0 && (
                <div style={{ color: "#4a5568", textAlign: "center", padding: "20px 0", fontSize: 14 }}>No reviews yet — be the first!</div>
              )}
              {reviews.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center", color: "#F97316", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{r.avatar || r.author_name?.slice(0, 2).toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{r.user || r.author_name}</span>
                      <span style={{ color: "#4a5568", fontSize: 12 }}>{r.time || r.relative_time_description}</span>
                    </div>
                    <StarRating rating={r.rating} />
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{r.text}</div>
                  </div>
                </div>
              ))}
            </>
          )}
          {tab === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {court.address && (
                <div style={{ background: "#0f1923", border: "1px solid #1e2d3d", borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Address</div>
                  <div style={{ color: "#fff", fontSize: 14 }}>{court.address}</div>
                </div>
              )}
              <a href={`https://www.google.com/maps/search/?api=1&query=${court.lat},${court.lng}`} target="_blank" rel="noreferrer"
                style={{ background: "#F97316", color: "#fff", borderRadius: 12, padding: "14px", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "block" }}>
                Open in Google Maps
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function getDistanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

function MapComponent({ courts, selected, onSelect, userLocation }) {
  const [infoOpen, setInfoOpen] = useState(false);

  const defaultCenter = userLocation || { lat: 38.9072, lng: -77.0369 };

  return (
    <Map
      defaultCenter={defaultCenter}
      defaultZoom={13}
      mapId="pickup-map"
      style={{ width: "100%", height: "100%" }}
      styles={[
        { elementType: "geometry", stylers: [{ color: "#0a0f14" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0a0f14" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#111b26" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f1923" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#060d14" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ]}
    >
      {userLocation && (
        <AdvancedMarker position={userLocation}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#3b82f6", border: "2px solid #fff", boxShadow: "0 0 8px rgba(59,130,246,0.8)" }} />
        </AdvancedMarker>
      )}
      {courts.map((court) => (
        <AdvancedMarker
          key={court.place_id}
          position={{ lat: court.lat, lng: court.lng }}
          onClick={() => { onSelect(court); setInfoOpen(true); }}
        >
          <div style={{
            width: selected?.place_id === court.place_id ? 40 : 30,
            height: selected?.place_id === court.place_id ? 40 : 30,
            borderRadius: "50%",
            background: selected?.place_id === court.place_id ? "#F97316" : "#1e3a5f",
            border: `2px solid ${selected?.place_id === court.place_id ? "#fff" : "#F97316"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: selected?.place_id === court.place_id ? 18 : 14,
            transition: "all 0.2s",
            boxShadow: selected?.place_id === court.place_id ? "0 0 0 4px rgba(249,115,22,0.3)" : "none",
            cursor: "pointer",
          }}>🏀</div>
        </AdvancedMarker>
      ))}
      {selected && infoOpen && (
        <InfoWindow position={{ lat: selected.lat, lng: selected.lng }} onCloseClick={() => setInfoOpen(false)}>
          <div style={{ background: "#0a0f14", padding: "6px 4px", minWidth: 160 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{selected.name}</div>
            <div style={{ color: "#F97316", fontSize: 12 }}>⭐ {selected.rating?.toFixed(1) || "—"} · {selected.distance} mi away</div>
          </div>
        </InfoWindow>
      )}
    </Map>
  );
}

export default function PickUpApp() {
  const [courts, setCourts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("split");
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("Locating...");

  const fetchCourts = useCallback((lat, lng) => {
    if (!window.google) return;
    const service = new window.google.maps.places.PlacesService(document.createElement("div"));
    const request = {
      location: new window.google.maps.LatLng(lat, lng),
      radius: 8000,
      keyword: "basketball court",
      type: "park",
    };
    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const mapped = results.map((place) => ({
          place_id: place.place_id,
          name: place.name,
          address: place.vicinity,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          rating: place.rating,
          totalRatings: place.user_ratings_total,
          openNow: place.opening_hours?.open_now,
          photo: place.photos?.[0]?.getUrl({ maxWidth: 600 }),
          reviews: [],
          distance: getDistanceMiles(lat, lng, place.geometry.location.lat(), place.geometry.location.lng()),
        }));
        const sorted = mapped.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        setCourts(sorted);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        // Reverse geocode for city name
        fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${API_KEY}`)
          .then(r => r.json())
          .then(data => {
            const city = data.results?.[0]?.address_components?.find(c => c.types.includes("locality"))?.long_name;
            const state = data.results?.[0]?.address_components?.find(c => c.types.includes("administrative_area_level_1"))?.short_name;
            if (city && state) setLocationName(`${city}, ${state}`);
          });
      },
      () => {
        // Default to DC if location denied
        setUserLocation({ lat: 38.9072, lng: -77.0369 });
        setLocationName("Washington, DC");
        setLoading(false);
      }
    );
  }, []);

  const filtered = courts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <APIProvider apiKey={API_KEY} onLoad={() => userLocation && fetchCourts(userLocation.lat, userLocation.lng)}>
      <InnerApp
        courts={filtered}
        allCourts={courts}
        selected={selected}
        setSelected={setSelected}
        search={search}
        setSearch={setSearch}
        view={view}
        setView={setView}
        userLocation={userLocation}
        loading={loading}
        locationName={locationName}
        fetchCourts={fetchCourts}
        setCourts={setCourts}
      />
    </APIProvider>
  );
}

function InnerApp({ courts, selected, setSelected, search, setSearch, view, setView, userLocation, loading, locationName, fetchCourts, setCourts }) {
  const { status } = useGoogleMapsStatus();

  useEffect(() => {
    if (status === "LOADING" || !userLocation) return;
    fetchCourts(userLocation.lat, userLocation.lng);
  }, [status, userLocation]);

  return (
    <div style={{ minHeight: "100vh", background: "#06090d", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0a0f14; } ::-webkit-scrollbar-thumb { background: #1e2d3d; border-radius: 4px; }
        input, textarea { outline: none; }
        input::placeholder, textarea::placeholder { color: #374151; }
        .gm-style-iw { background: #0a0f14 !important; color: #fff !important; }
        .gm-style-iw-d { background: #0a0f14 !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#06090d", borderBottom: "1px solid #0f1923", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#F97316", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏀</div>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: "0.08em" }}>PICKUP</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["split", "map", "list"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? "#F97316" : "#0f1923", border: `1px solid ${view === v ? "#F97316" : "#1a2530"}`, color: view === v ? "#fff" : "#64748b", borderRadius: 8, padding: "6px 12px", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{v}</button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #0f1923", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courts or locations..." style={{ width: "100%", background: "#0a0f14", border: "1px solid #1a2530", borderRadius: 10, padding: "9px 12px 9px 36px", color: "#fff", fontFamily: "inherit", fontSize: 14 }} />
        </div>
        <div style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>📍 {locationName}</div>
      </div>

      {/* Main */}
      <div style={{ display: "grid", gridTemplateColumns: view === "list" ? "1fr" : view === "map" ? "1fr" : "380px 1fr", height: "calc(100vh - 120px)" }}>
        {view !== "map" && (
          <div style={{ overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12, borderRight: "1px solid #0f1923" }}>
            <div style={{ color: "#4a5568", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {loading ? "Finding courts near you..." : `${courts.length} courts found near you`}
            </div>
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ height: 180, borderRadius: 16, background: "#0a0f14", border: "1px solid #1a2530", animation: "pulse 1.5s infinite" }} />
                ))}
              </div>
            )}
            {!loading && courts.map(court => (
              <CourtCard key={court.place_id} court={court} onClick={setSelected} active={selected?.place_id === court.place_id} />
            ))}
          </div>
        )}

        {view !== "list" && (
          <div style={{ position: "relative" }}>
            <MapComponent courts={courts} selected={selected} onSelect={setSelected} userLocation={userLocation} />
          </div>
        )}
      </div>

      {selected && <CourtDetail court={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// Hook to get Google Maps loading status
function useGoogleMapsStatus() {
  const [status, setStatus] = useState("LOADING");
  useEffect(() => {
    const check = setInterval(() => {
      if (window.google?.maps?.places) {
        setStatus("LOADED");
        clearInterval(check);
      }
    }, 100);
    return () => clearInterval(check);
  }, []);
  return { status };
}